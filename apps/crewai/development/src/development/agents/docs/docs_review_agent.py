import logging
from typing import List, Optional, Any
from crewai import Agent, Task
from langchain.tools import BaseTool
from github import Github
import os
import requests
from bs4 import BeautifulSoup
from markdown_it import MarkdownIt
import re
from pathlib import Path
from pydantic import Field, PrivateAttr
import pathspec

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('DocsReviewAgent')

class FetchDocsTool(BaseTool):
    name: str = "fetch_docs"
    description: str = "Fetches content from a local MDX file in the Astro docs app"
    _docs_agent: Any = PrivateAttr()
    
    def __init__(self, agent_instance):
        super().__init__()
        self._docs_agent = agent_instance
        object.__setattr__(self, 'func', self._run)  # Assign the main function to the func attribute
        
    def _run(self, url: str) -> Optional[str]:
        return self._docs_agent.fetch_docs(url)

class ExtractCodeRefsTool(BaseTool):
    name: str = "extract_code_references"
    description: str = "Extracts code references and important terms from markdown content"
    _docs_agent: Any = PrivateAttr()
    
    def __init__(self, agent_instance):
        super().__init__()
        self._docs_agent = agent_instance
        object.__setattr__(self, 'func', self._run)
        
    def _run(self, markdown_text: str) -> List[str]:
        return self._docs_agent.extract_code_references(markdown_text)

class SearchCodebaseTool(BaseTool):
    name: str = "search_codebase"
    description: str = "Searches the local codebase for files containing the keywords"
    _docs_agent: Any = PrivateAttr()
    
    def __init__(self, agent_instance):
        super().__init__()
        self._docs_agent = agent_instance
        object.__setattr__(self, 'func', self._run)
        
    def _run(self, repo_path: str, keywords: List[str]) -> List[str]:
        return self._docs_agent.search_codebase(repo_path, keywords)

class AnalyzeDiscrepanciesTool(BaseTool):
    name: str = "analyze_discrepancies"
    description: str = "Analyzes discrepancies between documentation and code"
    _docs_agent: Any = PrivateAttr()
    
    def __init__(self, agent_instance):
        super().__init__()
        self._docs_agent = agent_instance
        object.__setattr__(self, 'func', self._run)
        
    def _run(self, doc_content: str, code_files: List[str], repo_path: str) -> List[dict]:
        return self._docs_agent.analyze_discrepancies(doc_content, code_files, repo_path)

class PostToGiscusTool(BaseTool):
    name: str = "post_to_giscus"
    description: str = "Posts a comment to GitHub Discussions via Giscus"
    _docs_agent: Any = PrivateAttr()
    
    def __init__(self, agent_instance):
        super().__init__()
        self._docs_agent = agent_instance
        object.__setattr__(self, 'func', self._run)
        
    def _run(self, repo_name: str, discussion_category_id: str, content: str) -> bool:
        return self._docs_agent.post_to_giscus(repo_name, discussion_category_id, content)

class DocsReviewAgent:
    """Agent responsible for reviewing documentation and finding inconsistencies with codebase."""
    
    def __init__(self, github_token: Optional[str] = None):
        self.github_token = github_token or os.getenv("GITHUB_TOKEN")
        if not self.github_token:
            raise ValueError("GitHub token is required")
        
        logger.info("Initializing DocsReviewAgent")
        
        # Define tools properly
        self.tools = [
            FetchDocsTool(self),
            ExtractCodeRefsTool(self),
            SearchCodebaseTool(self),
            AnalyzeDiscrepanciesTool(self),
            PostToGiscusTool(self)
        ]
        logger.info("Tools initialized successfully")
            
        self.crewai_agent = Agent(
            role="Documentation Reviewer",
            goal="Analyze documentation for inconsistencies with the codebase and suggest improvements",
            backstory="An AI agent specialized in ensuring documentation accuracy and maintaining synchronization with codebase",
            verbose=True,
            allow_delegation=False,
            tools=self.tools
        )
        logger.info("CrewAI agent initialized")
        
        # Initialize GitHub client
        self.github = Github(self.github_token)
        
        # Store the current docs file being reviewed
        self.current_docs_file = None
        
    def fetch_docs(self, url: str) -> Optional[str]:
        """Fetches content from a local MDX file in the Astro docs app."""
        logger.info(f"Attempting to fetch docs from: {url}")
        try:
            # Convert URL path to local file path
            file_path = Path(url)
            if not file_path.exists():
                logger.error(f"MDX file not found: {url}")
                raise FileNotFoundError(f"MDX file not found: {url}")
                
            # Store the current docs file path
            self.current_docs_file = file_path
            logger.info(f"Successfully loaded MDX file: {file_path}")
                
            # Read the MDX content
            content = file_path.read_text()
            return content
        except Exception as e:
            logger.error(f"Error reading MDX file: {e}")
            return None

    def extract_code_references(self, markdown_text: str) -> List[str]:
        """Extracts code references and important terms from markdown content."""
        logger.info("Starting code reference extraction")
        md = MarkdownIt()
        tokens = md.parse(markdown_text)
        code_references = set()
        
        for token in tokens:
            if token.type == "fence":  # Code blocks
                logger.debug("Processing code fence block")
                code = token.content
                # Extract function names, class names, and important terms
                references = re.findall(r'\b(?:class|def|function|const|let|var)\s+(\w+)', code)
                code_references.update(references)
            elif token.type == "inline" and "`" in token.content:  # Inline code
                logger.debug("Processing inline code")
                # Extract terms within backticks
                references = re.findall(r'`([^`]+)`', token.content)
                code_references.update(references)
        
        logger.info(f"Found {len(code_references)} unique code references")
        return list(code_references)

    def search_codebase(self, repo_path: str, keywords: List[str]) -> List[str]:
        """Searches the local codebase for files containing the keywords."""
        logger.info(f"Searching codebase in {repo_path} for {len(keywords)} keywords")
        matching_files = set()  # Using set to avoid duplicates
        repo_path = Path(repo_path)
        
        # Load .gitignore patterns
        gitignore_path = repo_path / '.gitignore'
        gitignore_patterns = []
        if gitignore_path.exists():
            logger.debug("Loading .gitignore patterns")
            with open(gitignore_path, 'r') as f:
                gitignore_patterns = [line.strip() for line in f if line.strip() and not line.startswith('#')]
        
        # Create pathspec matcher
        spec = pathspec.PathSpec.from_lines(
            pathspec.patterns.GitWildMatchPattern,
            gitignore_patterns
        )
        
        # Additional binary and system files to exclude
        excluded_extensions = {'.pyc', '.pyo', '.pyd', '.so', '.dll', '.dylib', '.class', '.exe', '.bin', '.pkl', '.db'}
        searchable_extensions = {'.py', '.js', '.ts', '.jsx', '.tsx', '.md', '.mdx'}
        
        def should_skip(path: Path) -> bool:
            """Helper to determine if a path should be skipped."""
            try:
                # Get path relative to repo root for gitignore matching
                relative_path = path.relative_to(repo_path)
                
                # Skip if matches gitignore patterns
                if spec.match_file(str(relative_path)):
                    return True
                
                # Skip binary files
                if path.suffix in excluded_extensions:
                    return True
                
                # Skip if not in searchable extensions
                if path.suffix not in searchable_extensions:
                    return True
                
                return False
            except Exception as e:
                logger.warning(f"Error checking path {path}: {e}")
                return True

        # First, collect all searchable files
        logger.info("Collecting searchable files...")
        searchable_files = []
        for file_path in repo_path.rglob("*"):
            if file_path.is_file() and not should_skip(file_path):
                searchable_files.append(file_path)
        
        total_files = len(searchable_files)
        logger.info(f"Found {total_files} files to search through")
        
        # Then search through the files
        for i, file_path in enumerate(searchable_files, 1):
            if i % 100 == 0:  # Log progress every 100 files
                logger.info(f"Searched through {i}/{total_files} files ({(i/total_files)*100:.1f}%)")
            
            try:
                content = file_path.read_text()
                for keyword in keywords:
                    if keyword in content:
                        relative_path = str(file_path.relative_to(repo_path))
                        matching_files.add(relative_path)
                        logger.debug(f"Found match for '{keyword}' in: {relative_path}")
                        break  # Once we find one keyword, no need to check others for this file
            except Exception as e:
                logger.warning(f"Error reading file {file_path}: {e}")
                continue
        
        logger.info(f"Search complete. Found {len(matching_files)} files containing keywords")
        return list(matching_files)

    def analyze_discrepancies(self, doc_content: str, code_files: List[str], repo_path: str) -> List[dict]:
        """Analyzes discrepancies between documentation and code."""
        logger.info("Starting discrepancy analysis")
        discrepancies = []
        
        for file_path in code_files:
            logger.debug(f"Analyzing file: {file_path}")
            try:
                full_path = Path(repo_path) / file_path
                code_content = full_path.read_text()
                
                # Extract code examples from docs
                doc_code_blocks = re.findall(r'```[\w]*\n(.*?)```', doc_content, re.DOTALL)
                logger.debug(f"Found {len(doc_code_blocks)} code blocks in documentation")
                
                # Compare code examples with actual code
                for block in doc_code_blocks:
                    if block.strip() in code_content:
                        continue
                        
                    # Look for similar but not identical code
                    similar_code = self._find_similar_code(block.strip(), code_content)
                    if similar_code:
                        logger.info(f"Found discrepancy in {file_path}")
                        discrepancies.append({
                            'file': file_path,
                            'type': 'code_mismatch',
                            'docs_version': block.strip(),
                            'code_version': similar_code
                        })
                        
            except Exception as e:
                logger.error(f"Error analyzing {file_path}: {e}")
                
        logger.info(f"Analysis complete. Found {len(discrepancies)} discrepancies")
        return discrepancies

    def post_to_giscus(self, repo_name: str, discussion_category_id: str, content: str) -> bool:
        """Posts a comment to GitHub Discussions in a format that Giscus can find."""
        try:
            # GraphQL endpoint
            url = 'https://api.github.com/graphql'
            headers = {
                'Authorization': f'bearer {self.github_token}',
                'Content-Type': 'application/json',
            }

            # First, get the repository ID using GraphQL
            query = """
            query($owner: String!, $name: String!) {
                repository(owner: $owner, name: $name) {
                    id
                }
            }
            """
            owner, name = repo_name.split('/')
            variables = {
                'owner': owner,
                'name': name
            }

            logger.info("Fetching repository ID...")
            response = requests.post(url, headers=headers, json={'query': query, 'variables': variables})
            response.raise_for_status()
            result = response.json()
            
            if 'errors' in result:
                logger.error(f"GraphQL Error: {result['errors']}")
                return False
                
            repository_id = result['data']['repository']['id']
            logger.debug(f"Repository ID: {repository_id}")

            # Now create the discussion
            if not self.current_docs_file:
                raise ValueError("No documentation file is currently being reviewed")
            
            # Extract the relevant path parts for pathname mapping
            # From: /Users/jhs/Projects/sfh/apps/docs/src/content/docs/dev/stack/turborepo.mdx
            # To: dev/stack/turborepo
            try:
                parts = self.current_docs_file.parts
                content_idx = parts.index('content')
                docs_idx = parts.index('docs', content_idx)
                path_parts = parts[docs_idx + 1:]  # Get parts after 'docs', including filename
                
                # Get the filename without extension and create the path
                path_parts = list(path_parts)
                path_parts[-1] = path_parts[-1].replace('.mdx', '').replace('.md', '')
                pathname = '/'.join(path_parts)
                
                # Use pathname as title (without leading or trailing slashes)
                title = pathname
                    
            except (ValueError, IndexError):
                # Fallback to just the filename without extension if path parsing fails
                title = self.current_docs_file.stem

            # Create discussion with minimal body
            create_discussion_mutation = """
            mutation($input: CreateDiscussionInput!) {
                createDiscussion(input: $input) {
                    discussion {
                        id
                        url
                    }
                }
            }
            """
            
            variables = {
                'input': {
                    'repositoryId': repository_id,
                    'categoryId': discussion_category_id,
                    'title': title,
                    'body': "Documentation review thread"  # Keep the discussion body minimal
                }
            }

            logger.info(f"Creating discussion with title: {title}")
            response = requests.post(url, headers=headers, json={'query': create_discussion_mutation, 'variables': variables})
            response.raise_for_status()
            result = response.json()
            
            if 'errors' in result:
                logger.error(f"GraphQL Error: {result['errors']}")
                return False
                
            discussion_id = result['data']['createDiscussion']['discussion']['id']
            discussion_url = result['data']['createDiscussion']['discussion']['url']
            logger.info(f"Discussion created successfully at: {discussion_url}")

            # Now add the report as a comment
            add_comment_mutation = """
            mutation($input: AddDiscussionCommentInput!) {
                addDiscussionComment(input: $input) {
                    comment {
                        id
                        url
                    }
                }
            }
            """

            variables = {
                'input': {
                    'discussionId': discussion_id,
                    'body': content
                }
            }

            logger.info("Adding report as comment...")
            response = requests.post(url, headers=headers, json={'query': add_comment_mutation, 'variables': variables})
            response.raise_for_status()
            result = response.json()

            if 'errors' in result:
                logger.error(f"GraphQL Error when adding comment: {result['errors']}")
                return False

            comment_url = result['data']['addDiscussionComment']['comment']['url']
            logger.info(f"Comment added successfully at: {comment_url}")
            return True
            
        except Exception as e:
            logger.error(f"Error posting to GitHub Discussions: {e}")
            return False
            
    def _find_similar_code(self, docs_code: str, actual_code: str) -> Optional[str]:
        """Helper method to find similar code snippets."""
        # Remove whitespace and comments for comparison
        clean_docs = re.sub(r'\s+|#.*$', '', docs_code, flags=re.MULTILINE)
        
        # Look for similar code segments
        code_lines = actual_code.split('\n')
        for i in range(len(code_lines)):
            window = '\n'.join(code_lines[i:i+len(docs_code.split('\n'))])
            clean_window = re.sub(r'\s+|#.*$', '', window, flags=re.MULTILINE)
            
            if clean_docs in clean_window:
                return window
                
        return None

    def _extract_related_files(self, doc_content: str) -> List[str]:
        """Extracts files listed in the Related Files section of the documentation."""
        logger.info("Extracting related files from documentation")
        
        # Look for Related Files section using common markdown patterns
        # The section might have explanatory text before the list
        patterns = [
            # Match section with backtick-formatted paths
            r'(?:##?\s*Related Files[^\n]*\n(?:[^\n]*\n)*?)((?:[-*]\s*`[^`]+`[^\n]*\n)+)',
            # Match section with plain list items
            r'(?:##?\s*Related Files[^\n]*\n(?:[^\n]*\n)*?)((?:[-*]\s*\/[^\n]+\n)+)',
            # Match section with mixed format
            r'(?:##?\s*Related Files[^\n]*\n(?:[^\n]*\n)*?)((?:[-*]\s*(?:`[^`]+`|\/[^\n]+)[^\n]*\n)+)',
        ]
        
        related_files = set()
        
        for pattern in patterns:
            matches = re.finditer(pattern, doc_content, re.MULTILINE | re.IGNORECASE)
            for match in matches:
                file_list = match.group(1)
                # Extract both backtick-formatted and plain paths
                files = re.findall(r'(?:`([^`]+)`|[-*]\s*(\/[^\s\n]+))', file_list)
                for backtick_match, plain_match in files:
                    filename = backtick_match or plain_match
                    if filename:
                        # Clean up the path
                        clean_path = self._normalize_file_path(filename.strip())
                        if clean_path:
                            related_files.add(clean_path)
                            
                # Also look for paths in explanatory text
                explanatory_paths = re.findall(r'(?:^|\s)(?:`([^`]+)`|(/[^\s,]+))', file_list)
                for backtick_match, plain_match in explanatory_paths:
                    filename = backtick_match or plain_match
                    if filename:
                        clean_path = self._normalize_file_path(filename.strip())
                        if clean_path:
                            related_files.add(clean_path)
        
        # If no files found in Related Files section, try to find files mentioned in code blocks
        if not related_files:
            logger.info("No files found in Related Files section, checking code blocks")
            code_blocks = re.finditer(r'```(?:json|yaml)\n(.*?)```', doc_content, re.DOTALL)
            for block in code_blocks:
                content = block.group(1)
                # Look for file paths in code blocks
                paths = re.findall(r'(?:"([^"]+\.[a-zA-Z]+)"|\'([^\']+\.[a-zA-Z]+)\')', content)
                for quote_match, single_match in paths:
                    filename = quote_match or single_match
                    if filename:
                        clean_path = self._normalize_file_path(filename.strip())
                        if clean_path:
                            related_files.add(clean_path)
        
        logger.info(f"Found {len(related_files)} related files in documentation")
        for file in related_files:
            logger.debug(f"Found related file: {file}")
        return list(related_files)

    def _normalize_file_path(self, path: str) -> Optional[str]:
        """Normalizes file paths found in documentation."""
        if not path:
            return None
            
        # Remove any leading ./ or /
        path = re.sub(r'^\.?/', '', path)
        
        # Skip if it's not a file path or doesn't have an extension
        if not re.search(r'\.[a-zA-Z]+$', path):
            return None
            
        # Skip common non-source files
        if re.match(r'^(node_modules|dist|build|coverage|\.git)/', path):
            return None
            
        return path

    def _verify_code_examples(self, doc_content: str, file_path: str) -> List[dict]:
        """Verifies code examples in documentation against actual code file."""
        logger.info(f"Verifying code examples against {file_path}")
        
        try:
            with open(file_path, 'r') as f:
                actual_code = f.read()
        except Exception as e:
            logger.error(f"Error reading file {file_path}: {e}")
            return []

        # Extract code blocks with their language specifiers
        code_blocks = re.finditer(r'```(\w*)\n(.*?)```', doc_content, re.DOTALL)
        discrepancies = []
        
        # Group code blocks by language for batch processing
        blocks_by_lang = {}
        for block_match in code_blocks:
            lang = block_match.group(1).lower()
            block = block_match.group(2).strip()
            
            # Skip if empty language or non-code blocks
            if not lang or lang in ['bash', 'shell', 'console', 'output']:
                continue
                
            if lang not in blocks_by_lang:
                blocks_by_lang[lang] = []
            blocks_by_lang[lang].append(block)

        # Process each language group
        for lang, blocks in blocks_by_lang.items():
            if lang == 'json':
                # For JSON, first try structured comparison
                try:
                    json_discrepancies = self._compare_json(blocks[0], actual_code, file_path)
                    if json_discrepancies:
                        discrepancies.extend(json_discrepancies)
                    continue
                except Exception as e:
                    logger.error(f"Error in JSON comparison, falling back to Claude: {e}")
            
            # Use Claude for semantic comparison
            try:
                semantic_discrepancies = self._compare_with_claude(
                    blocks, actual_code, file_path, lang
                )
                discrepancies.extend(semantic_discrepancies)
            except Exception as e:
                logger.error(f"Error in Claude comparison: {e}")
                
        return discrepancies

    def _compare_with_claude(self, doc_blocks: List[str], actual_code: str, file_path: str, lang: str) -> List[dict]:
        """Uses Claude to perform semantic comparison between documentation and code."""
        from anthropic import Anthropic
        
        discrepancies = []
        anthropic = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        
        # Prepare the context for Claude
        prompt = f"""You are performing a documentation verification task. You need to compare code examples from documentation against the actual codebase implementation.

Language: {lang}
File: {file_path}

Your task is to:
1. Compare the documentation code examples against the actual implementation
2. Identify any semantic differences, inconsistencies, or outdated patterns
3. Consider both exact matches and logically equivalent code
4. Pay special attention to:
   - API changes
   - Parameter differences
   - Type changes
   - Structural changes
   - Deprecated features
   - Best practices violations

Actual codebase implementation:
```{lang}
{actual_code}
```

Documentation code examples:
"""

        # Add each documentation block
        for i, block in enumerate(doc_blocks, 1):
            prompt += f"\nExample {i}:\n```{lang}\n{block}\n```\n"

        prompt += """\nAnalyze the differences and provide a structured response in the following format:
{
    "discrepancies": [
        {
            "type": "semantic_difference|api_change|parameter_mismatch|deprecated_feature|best_practice|other",
            "severity": "high|medium|low",
            "docs_version": "relevant code from docs",
            "code_version": "relevant code from implementation",
            "explanation": "detailed explanation of the difference"
        }
    ]
}

Only include actual discrepancies. If the code is equivalent, return an empty list."""

        try:
            # Get Claude's analysis
            response = anthropic.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=4096,
                temperature=0,
                system="You are a documentation verification assistant specialized in comparing code examples against actual implementations. Be thorough and precise in identifying discrepancies.",
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )
            
            # Parse Claude's response
            import json
            analysis = json.loads(response.content[0].text)
            
            # Convert Claude's analysis to our format
            for disc in analysis.get('discrepancies', []):
                discrepancies.append({
                    'file': file_path,
                    'type': 'semantic_mismatch',
                    'language': lang,
                    'docs_version': disc['docs_version'],
                    'code_version': disc['code_version'],
                    'context': {
                        'type': disc['type'],
                        'severity': disc['severity'],
                        'explanation': disc['explanation']
                    }
                })
                
        except Exception as e:
            logger.error(f"Error getting Claude's analysis: {e}")
            
        return discrepancies

    def _compare_json(self, docs_json: str, actual_json: str, file_path: str) -> List[dict]:
        """Compares JSON content from docs against actual JSON file."""
        import json
        from deepdiff import DeepDiff
        
        discrepancies = []
        
        try:
            # Parse both JSONs
            docs_data = json.loads(docs_json)
            actual_data = json.loads(actual_json)
            
            # Use DeepDiff to find differences
            diff = DeepDiff(docs_data, actual_data, ignore_order=True)
            
            if diff:
                # Process different types of changes
                for change_type, changes in diff.items():
                    if change_type in ['values_changed', 'type_changes']:
                        for path, change in changes.items():
                            # Clean up the path for display
                            clean_path = path.replace('root', '', 1).replace("['", '.').replace("']", '')
                            if clean_path.startswith('.'):
                                clean_path = clean_path[1:]
                                
                            # Create a focused snippet of the change
                            docs_snippet = self._create_json_snippet(docs_data, clean_path, change.get('old_value'))
                            actual_snippet = self._create_json_snippet(actual_data, clean_path, change.get('new_value'))
                            
                            discrepancies.append({
                                'file': file_path,
                                'type': 'json_value_mismatch',
                                'language': 'json',
                                'path': clean_path,
                                'docs_version': docs_snippet,
                                'code_version': actual_snippet,
                                'context': {
                                    'path': clean_path,
                                    'docs_value': str(change.get('old_value')),
                                    'actual_value': str(change.get('new_value'))
                                }
                            })
                            
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing JSON: {e}")
        except Exception as e:
            logger.error(f"Error comparing JSON: {e}")
            
        return discrepancies

    def _create_json_snippet(self, data: dict, path: str, value: Any) -> str:
        """Creates a JSON snippet focusing on the changed value and its context."""
        import json
        
        # Split the path into parts
        parts = path.split('.')
        
        # Create a nested structure containing just the relevant part
        result = {}
        current = result
        target = data
        
        for i, part in enumerate(parts[:-1]):
            current[part] = {}
            current = current[part]
            target = target.get(part, {})
            
        # Add the final value
        last_part = parts[-1]
        if isinstance(target, dict) and last_part in target:
            current[last_part] = value
            
        # Convert to pretty JSON string
        return json.dumps(result, indent=2)

    def _normalize_code(self, code: str) -> str:
        """Normalizes code for comparison by removing whitespace and comments."""
        # Remove comments
        code = re.sub(r'#.*$', '', code, flags=re.MULTILINE)  # Python comments
        code = re.sub(r'//.*$', '', code, flags=re.MULTILINE)  # JavaScript/TypeScript comments
        code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)  # Multi-line comments
        
        # Normalize whitespace
        code = re.sub(r'\s+', ' ', code)
        return code.strip()

    def _get_code_context(self, code_snippet: str, full_code: str, context_lines: int = 3) -> dict:
        """Gets the surrounding context of a code snippet."""
        lines = full_code.split('\n')
        snippet_lines = code_snippet.split('\n')
        
        # Find the snippet in the full code
        for i in range(len(lines)):
            if all(line.strip() in '\n'.join(lines[i:i+len(snippet_lines)]) 
                  for line in snippet_lines):
                start = max(0, i - context_lines)
                end = min(len(lines), i + len(snippet_lines) + context_lines)
                return {
                    'start_line': start + 1,
                    'end_line': end,
                    'before': '\n'.join(lines[start:i]),
                    'after': '\n'.join(lines[i+len(snippet_lines):end])
                }
        return {}

    def review_documentation(self, docs_url: str, repo_path: str, repo_name: str, discussion_category_id: str) -> dict:
        """Main method to perform a complete documentation review."""
        try:
            logger.info(f"Starting documentation review for {docs_url}")
            
            # 1. Fetch documentation
            logger.info("Step 1: Fetching documentation")
            doc_content = self.fetch_docs(docs_url)
            if not doc_content:
                error_msg = "Failed to fetch documentation"
                logger.error(error_msg)
                return {"error": error_msg}
            
            # 2. Extract related files
            logger.info("Step 2: Extracting related files")
            related_files = self._extract_related_files(doc_content)
            
            # 3. Extract code references as backup
            logger.info("Step 3: Extracting additional code references")
            code_refs = self.extract_code_references(doc_content)
            
            # 4. Verify each related file
            logger.info("Step 4: Verifying code examples")
            all_discrepancies = []
            
            # First check related files
            for file_path in related_files:
                full_path = os.path.join(repo_path, file_path)
                if os.path.exists(full_path):
                    discrepancies = self._verify_code_examples(doc_content, full_path)
                    all_discrepancies.extend(discrepancies)
            
            # Then search codebase for additional references if needed
            if code_refs:
                additional_files = self.search_codebase(repo_path, code_refs)
                for file_path in additional_files:
                    if file_path not in related_files:  # Only check files we haven't checked yet
                        full_path = os.path.join(repo_path, file_path)
                        discrepancies = self._verify_code_examples(doc_content, full_path)
                        all_discrepancies.extend(discrepancies)
            
            # 5. Generate report
            logger.info("Step 5: Generating report")
            report = self._generate_report(docs_url, all_discrepancies, related_files)
            
            # 6. Post to GitHub Discussions
            logger.info("Step 6: Posting to GitHub Discussions")
            posted = self.post_to_giscus(repo_name, discussion_category_id, report)
            
            result = {
                "success": posted,
                "docs_url": docs_url,
                "related_files": related_files,
                "discrepancies_found": len(all_discrepancies),
                "report": report
            }
            
            return result
            
        except Exception as e:
            error_msg = f"Error during documentation review: {str(e)}"
            logger.error(error_msg)
            raise

    def _generate_report(self, docs_url: str, discrepancies: List[dict], related_files: List[str]) -> str:
        """Generates a formatted report of the documentation review."""
        report = f"# Documentation Review Report\n\n"
        report += f"## Reviewed Documentation\n{docs_url}\n\n"
        
        # List related files
        report += "## Related Files\n"
        if related_files:
            for file in related_files:
                report += f"- `{file}`\n"
        else:
            report += "*No related files explicitly mentioned in documentation*\n"
        
        if not discrepancies:
            report += "\n✅ **No discrepancies found between documentation and codebase.**\n"
            return report
            
        report += f"\n## Found Discrepancies ({len(discrepancies)})\n"
        
        # Group discrepancies by file
        by_file = {}
        for disc in discrepancies:
            file_path = disc['file']
            if file_path not in by_file:
                by_file[file_path] = []
            by_file[file_path].append(disc)
        
        for file_path, file_discs in by_file.items():
            report += f"\n### File: `{file_path}`\n"
            
            for i, disc in enumerate(file_discs, 1):
                report += f"\n#### Discrepancy {i}\n"
                
                if disc['type'] == 'json_value_mismatch':
                    report += f"*JSON Path: `{disc['path']}`*\n\n"
                    report += "```diff\n"
                    report += f"- Documentation version: {disc['context']['docs_value']}\n"
                    report += f"+ Actual value: {disc['context']['actual_value']}\n"
                    report += "```\n"
                    
                    report += "\nJSON Context:\n"
                    report += "```json\n"
                    report += f"# Documentation version:\n{disc['docs_version']}\n"
                    report += f"\n# Actual version:\n{disc['code_version']}\n"
                    report += "```\n"
                elif disc['type'] == 'semantic_mismatch':
                    report += f"*Type: {disc['context']['type']}*\n"
                    report += f"*Severity: {disc['context']['severity']}*\n"
                    report += f"*Language: {disc['language']}*\n\n"
                    
                    report += "```diff\n"
                    report += f"- Documentation version:\n{disc['docs_version']}\n"
                    report += f"+ Actual code:\n{disc['code_version']}\n"
                    report += "```\n"
                    
                    report += f"\nExplanation: {disc['context']['explanation']}\n"
                else:
                    # Handle other types of discrepancies
                    if disc.get('language'):
                        report += f"*Language: {disc['language']}*\n\n"
                    
                    report += "```diff\n"
                    report += f"- Documentation version:\n{disc['docs_version']}\n"
                    report += f"+ Actual code:\n{disc['code_version']}\n"
                    report += "```\n"
                    
                    # Add context if available
                    if context := disc.get('context'):
                        report += "\nContext:\n"
                        if context.get('before'):
                            report += f"```\n# Before\n{context['before']}\n```\n"
                        if context.get('after'):
                            report += f"```\n# After\n{context['after']}\n```\n"
        
        report += "\n## Recommendations\n"
        report += "1. Update the documentation to match the current codebase implementation\n"
        report += "2. Add version information to code examples if they represent older versions\n"
        report += "3. Consider adding automated documentation testing to your CI/CD pipeline\n"
        report += "4. Review the 'Related Files' section to ensure all relevant files are listed\n"
        
        return report 