from crewai import Agent, Crew, Process, Task
from langchain.tools import Tool
import os
import glob
import yaml
from typing import Dict, List, Optional, Any
from datetime import datetime
from functools import wraps
import uuid
from pydantic import Field, BaseModel


class Development:
    """Development crew for maintaining documentation and sitemap"""

    def __init__(self):
        self._setup_tools()
        self._load_configurations()
        self._create_agents_and_tasks()

    def _setup_tools(self):
        """Set up the tools"""
        self.tools = {
            "list_directory": Tool(
                name="List directory contents",
                func=list_directory,
                description="List up to 20 items in a directory, filtering out system files",
            ),
            "read_file": Tool(
                name="Read file contents",
                func=read_file,
                description="Read the first 4000 characters of a file",
            ),
            "generate_file_tree": Tool(
                name="Generate file tree",
                func=generate_file_tree,
                description="Generate a file tree up to 5 levels deep, excluding gitignored files",
            ),
        }

    def _load_configurations(self):
        """Load configuration files"""
        self.config_dir = os.path.join(os.path.dirname(__file__), "config")
        self.agents_config = self._load_yaml("agents.yaml")
        self.tasks_config = self._load_yaml("tasks.yaml")

    def _create_agents_and_tasks(self):
        """Create agents and tasks"""
        self.agents = self._create_agents()
        self.tasks = self._create_tasks()

    def _load_yaml(self, filename: str) -> Dict:
        """Load and parse a YAML configuration file"""
        filepath = os.path.join(self.config_dir, filename)
        with open(filepath, "r") as f:
            return yaml.safe_load(f)

    def _create_agents(self) -> Dict[str, Agent]:
        """Create agents from configuration"""
        agents = {}
        for agent_id, config in self.agents_config.items():
            if agent_id in ["sitemap_maintainer", "docs_validator"]:
                agent_tools = [self.tools[tool] for tool in config.get("tools", [])]
                agents[agent_id] = Agent(
                    role=config["role"],
                    goal=config["goal"],
                    backstory=config["backstory"],
                    verbose=True,
                    allow_delegation=False,
                    tools=agent_tools,
                    llm="claude-3-opus-20240229",
                )
        return agents

    def _create_tasks(self) -> List[Task]:
        """Create tasks from configuration"""
        tasks = []
        task_configs = {
            k: v
            for k, v in self.tasks_config.items()
            if k in ["sitemap_task", "validation_task"]
        }

        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        for task_id, config in task_configs.items():
            description = config["description"].format(
                root_path="/Users/jhs/Projects/sfh", current_time=current_time
            )

            expected_output = config["expected_output"]
            if "timestamp" in expected_output.lower():
                expected_output = expected_output.replace(
                    "{current_time}", current_time
                )

            task = Task(
                description=description,
                expected_output=expected_output,
                agent=self.agents[config["agent"]],
                output_file=config.get("output_file"),
            )
            tasks.append(task)
        return tasks

    def crew(self) -> Crew:
        """Creates and executes the Documentation Maintenance crew"""
        return Crew(
            agents=list(self.agents.values()),
            tasks=self.tasks,
            process=Process.sequential,
            verbose=True,
        )


def list_directory(path: str) -> str:
    """List the contents of a directory"""
    try:
        # Define directories and files to ignore
        ignore_patterns = {
            ".git",
            "node_modules",
            "__pycache__",
            ".venv",
            ".DS_Store",
            "*.pyc",
            "*.pyo",
            "*.pyd",
            ".env",
            ".vscode",
            ".idea",
            "dist",
            "build",
            "coverage",
            "tmp",
            "temp",
            "logs",
            ".next",
            ".cache",
        }

        # Add openlit directory to ignore patterns
        ignore_paths = {"apps/crewai/openlit", "apps/crewai/development/openlit"}

        items = glob.glob(os.path.join(path, "*"))
        filtered_items = []

        for item in items:
            basename = os.path.basename(item)
            rel_path = os.path.relpath(item, "/Users/jhs/Projects/sfh")

            # Skip if item matches any ignore pattern or is in ignore paths
            if not any(
                pattern in basename
                or basename.endswith(pattern.replace("*", ""))
                or pattern in item.lower()
                for pattern in ignore_patterns
            ) and not any(
                rel_path.startswith(ignore_path) for ignore_path in ignore_paths
            ):
                filtered_items.append(
                    f"{'[DIR]' if os.path.isdir(item) else '[FILE]'} {basename}"
                )

        return "\n".join(filtered_items[:20])  # Limit to top 20 items
    except Exception as e:
        return f"Error listing directory: {str(e)}"


def read_file(path: str) -> str:
    """Read the contents of a file with size limits"""
    try:
        # Skip certain file types
        if any(path.endswith(ext) for ext in [".pyc", ".pyo", ".pyd", ".log", ".lock"]):
            return "File type not supported for reading"

        with open(path, "r") as f:
            content = f.read(4000)  # Read only first 4000 chars
            if len(content) == 4000:
                content += "\n... (content truncated for length)"
            return content
    except Exception as e:
        return f"Error reading file: {str(e)}"


def generate_file_tree(path: str, max_depth: int = 5) -> str:
    """Generate a file tree up to specified depth, respecting gitignore"""

    def should_ignore(path: str, ignore_patterns: set, ignore_paths: set) -> bool:
        path_parts = path.split(os.sep)
        rel_path = os.path.relpath(path, "/Users/jhs/Projects/sfh")
        return any(
            any(
                pattern in part.lower() or part.endswith(pattern.replace("*", ""))
                for pattern in ignore_patterns
            )
            for part in path_parts
        ) or any(rel_path.startswith(ignore_path) for ignore_path in ignore_paths)

    def tree_helper(dir_path: str, prefix: str = "", depth: int = 0) -> List[str]:
        if depth > max_depth:
            return []

        ignore_patterns = {
            ".git",
            "node_modules",
            "__pycache__",
            ".venv",
            ".DS_Store",
            "*.pyc",
            "*.pyo",
            "*.pyd",
            ".env",
            ".vscode",
            ".idea",
            "dist",
            "build",
            "coverage",
            "tmp",
            "temp",
            "logs",
            ".next",
            ".cache",
        }

        ignore_paths = {"apps/crewai/openlit", "apps/crewai/development/openlit"}

        try:
            entries = os.listdir(dir_path)
            entries = sorted(
                [
                    e
                    for e in entries
                    if not should_ignore(
                        os.path.join(dir_path, e), ignore_patterns, ignore_paths
                    )
                ]
            )

            tree = []
            for i, entry in enumerate(entries):
                is_last = i == len(entries) - 1
                entry_path = os.path.join(dir_path, entry)

                # Add current entry
                marker = "└── " if is_last else "├── "
                tree.append(f"{prefix}{marker}{entry}")

                # Recursively add subdirectories
                if os.path.isdir(entry_path):
                    ext_prefix = "    " if is_last else "│   "
                    tree.extend(tree_helper(entry_path, prefix + ext_prefix, depth + 1))

            return tree
        except Exception as e:
            return [f"Error accessing {dir_path}: {str(e)}"]

    try:
        tree_lines = [".", *tree_helper(path)]
        return "\n".join(tree_lines)
    except Exception as e:
        return f"Error generating file tree: {str(e)}"
