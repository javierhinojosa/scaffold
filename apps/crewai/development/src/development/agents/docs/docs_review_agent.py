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
            logger.info(f"Successfully fetched documentation from {docs_url}")
            
            # 2. Extract code references
            logger.info("Step 2: Extracting code references")
            code_refs = self.extract_code_references(doc_content)
            logger.info(f"Found {len(code_refs)} code references")
            
            # 3. Search codebase
            logger.info("Step 3: Searching codebase")
            relevant_files = self.search_codebase(repo_path, code_refs)
            logger.info(f"Found {len(relevant_files)} relevant files")
            
            # 4. Analyze discrepancies
            logger.info("Step 4: Analyzing discrepancies")
            discrepancies = self.analyze_discrepancies(doc_content, relevant_files, repo_path)
            logger.info(f"Found {len(discrepancies)} discrepancies")
            
            # 5. Generate report
            logger.info("Step 5: Generating report")
            report = self._generate_report(docs_url, discrepancies)
            logger.info("Generated documentation review report")
            
            # 6. Post to GitHub Discussions
            logger.info("Step 6: Posting to GitHub Discussions")
            posted = self.post_to_giscus(repo_name, discussion_category_id, report)
            if posted:
                logger.info("Posted report to GitHub Discussions")
            else:
                logger.error("Failed to post to GitHub Discussions")
            
            result = {
                "success": posted,
                "docs_url": docs_url,
                "discrepancies_found": len(discrepancies),
                "report": report
            }
            
            if posted:
                logger.info("Documentation review completed successfully")
            else:
                logger.error("Documentation review completed but failed to post results")
                
            return result
            
        except Exception as e:
            error_msg = f"Error during documentation review: {str(e)}"
            logger.error(error_msg)
            raise

    def _generate_report(self, docs_url: str, discrepancies: List[dict]) -> str:
        """Generates a formatted report of the documentation review."""
        report = f"# Documentation Review Report\n\n"
        report += f"## Reviewed Documentation\n{docs_url}\n\n"
        
        if not discrepancies:
            report += "✅ No discrepancies found between documentation and codebase.\n"
            return report
            
        report += f"## Found Discrepancies\n"
        for i, disc in enumerate(discrepancies, 1):
            report += f"\n### {i}. Discrepancy in `{disc['file']}`\n"
            report += "```diff\n"
            report += f"- Documentation version:\n{disc['docs_version']}\n"
            report += f"+ Actual code:\n{disc['code_version']}\n"
            report += "```\n"
            
        report += "\n## Recommendations\n"
        report += "1. Review and update the documentation to match the current codebase\n"
        report += "2. Consider adding version information to code examples\n"
        report += "3. Set up automated documentation testing\n"
        
        return report 