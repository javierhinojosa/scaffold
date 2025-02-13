from crewai import Agent, Crew, Process, Task
from langchain.tools import Tool
import os
import glob
import yaml
from typing import Dict, List, Optional, Any
from datetime import datetime
from functools import wraps
from langfuse import Langfuse
import uuid
from pydantic import Field, BaseModel

# Initialize Langfuse
langfuse = Langfuse(
	public_key="pk-lf-4afcffd3-52dd-4ac4-9207-e455756501e1",
	secret_key="sk-lf-1f70fa56-a3d9-4970-b5ed-4bcb492c233c",
	host="https://us.cloud.langfuse.com"
)

# Store session IDs for crews
crew_sessions = {}

def trace_function(func):
	@wraps(func)
	def wrapper(*args, **kwargs):
		span = langfuse.span(name=func.__name__)
		try:
			result = func(*args, **kwargs)
			span.update(
				input={"args": str(args), "kwargs": str(kwargs)},
				output=str(result)
			)
			span.end()
			return result
		except Exception as e:
			span.update(error=str(e))
			span.end()
			raise
	return wrapper

@trace_function
def list_directory(path: str) -> str:
	"""List the contents of a directory"""
	try:
		# Define directories and files to ignore
		ignore_patterns = {
			'.git', 'node_modules', '__pycache__', '.venv',
			'.DS_Store', '*.pyc', '*.pyo', '*.pyd', '.env',
			'.vscode', '.idea', 'dist', 'build', 'coverage',
			'tmp', 'temp', 'logs', '.next', '.cache'
		}
		
		# Add openlit directory to ignore patterns
		ignore_paths = {
			'apps/crewai/openlit',
			'apps/crewai/development/openlit'
		}
		
		items = glob.glob(os.path.join(path, "*"))
		filtered_items = []
		
		for item in items:
			basename = os.path.basename(item)
			rel_path = os.path.relpath(item, '/Users/jhs/Projects/sfh')
			
			# Skip if item matches any ignore pattern or is in ignore paths
			if not any(pattern in basename or 
					  basename.endswith(pattern.replace('*', '')) or
					  pattern in item.lower()
					  for pattern in ignore_patterns) and \
			   not any(rel_path.startswith(ignore_path) for ignore_path in ignore_paths):
				filtered_items.append(f"{'[DIR]' if os.path.isdir(item) else '[FILE]'} {basename}")
		
		return "\n".join(filtered_items[:20])  # Limit to top 20 items
	except Exception as e:
		return f"Error listing directory: {str(e)}"

@trace_function
def read_file(path: str) -> str:
	"""Read the contents of a file with size limits"""
	try:
		# Skip certain file types
		if any(path.endswith(ext) for ext in ['.pyc', '.pyo', '.pyd', '.log', '.lock']):
			return "File type not supported for reading"
			
		with open(path, 'r') as f:
			content = f.read(4000)  # Read only first 4000 chars
			if len(content) == 4000:
				content += "\n... (content truncated for length)"
			return content
	except Exception as e:
		return f"Error reading file: {str(e)}"

@trace_function
def generate_file_tree(path: str, max_depth: int = 5) -> str:
	"""Generate a file tree up to specified depth, respecting gitignore"""
	def should_ignore(path: str, ignore_patterns: set, ignore_paths: set) -> bool:
		path_parts = path.split(os.sep)
		rel_path = os.path.relpath(path, '/Users/jhs/Projects/sfh')
		return any(
			any(pattern in part.lower() or 
				part.endswith(pattern.replace('*', ''))
				for pattern in ignore_patterns)
			for part in path_parts
		) or any(rel_path.startswith(ignore_path) for ignore_path in ignore_paths)

	def tree_helper(dir_path: str, prefix: str = "", depth: int = 0) -> List[str]:
		if depth > max_depth:
			return []

		ignore_patterns = {
			'.git', 'node_modules', '__pycache__', '.venv',
			'.DS_Store', '*.pyc', '*.pyo', '*.pyd', '.env',
			'.vscode', '.idea', 'dist', 'build', 'coverage',
			'tmp', 'temp', 'logs', '.next', '.cache'
		}

		ignore_paths = {
			'apps/crewai/openlit',
			'apps/crewai/development/openlit'
		}

		try:
			entries = os.listdir(dir_path)
			entries = sorted([e for e in entries 
							if not should_ignore(os.path.join(dir_path, e), ignore_patterns, ignore_paths)])
			
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

class TracedCrew(Crew):
	"""A CrewAI crew with Langfuse tracing"""
	
	def set_session_id(self, session_id: str) -> None:
		"""Set the session ID for tracing"""
		crew_sessions[id(self)] = session_id

	def get_session_id(self) -> Optional[str]:
		"""Get the session ID for tracing"""
		return crew_sessions.get(id(self))

	def kickoff(self, *args, **kwargs) -> Any:
		session_id = self.get_session_id()
		if not session_id:
			return super().kickoff(*args, **kwargs)
			
		execution_span = langfuse.span(
			name="crew_execution",
			parent_id=session_id
		)
		try:
			result = super().kickoff(*args, **kwargs)
			execution_span.update(
				input={"args": str(args), "kwargs": str(kwargs)},
				output=str(result)
			)
			return result
		except Exception as e:
			execution_span.update(error=str(e))
			raise
		finally:
			try:
				execution_span.end()
			except:
				pass
			# Clean up the session ID after execution
			crew_sessions.pop(id(self), None)

class Development():
	"""Development crew for maintaining documentation and sitemap"""

	def __init__(self):
		# Create a session ID for this crew run
		self.session_id = str(uuid.uuid4())
		# Create a parent trace for the entire session
		self.trace = langfuse.trace(
			name="crew_session",
			id=self.session_id,
			metadata={
				"session_start": datetime.now().isoformat(),
				"type": "documentation_crew"
			}
		)
		
		span = langfuse.span(
			name="Development.__init__",
			parent_id=self.session_id
		)
		try:
			self.tools = {
				'list_directory': Tool(
					name="List directory contents",
					func=self.trace_tool(list_directory),
					description="List up to 20 items in a directory, filtering out system files"
				),
				'read_file': Tool(
					name="Read file contents",
					func=self.trace_tool(read_file),
					description="Read the first 4000 characters of a file"
				),
				'generate_file_tree': Tool(
					name="Generate file tree",
					func=self.trace_tool(generate_file_tree),
					description="Generate a file tree up to 5 levels deep, excluding gitignored files"
				)
			}
			
			self.config_dir = os.path.join(os.path.dirname(__file__), 'config')
			self.agents_config = self._load_yaml('agents.yaml')
			self.tasks_config = self._load_yaml('tasks.yaml')
			
			self.agents = self._create_agents()
			self.tasks = self._create_tasks()
			span.update(output="Development crew initialized successfully")
		except Exception as e:
			span.update(error=str(e))
			raise
		finally:
			try:
				span.end()
			except:
				pass

	def trace_tool(self, func):
		"""Wrapper to trace tool executions within the session context"""
		@wraps(func)
		def wrapper(*args, **kwargs):
			span = langfuse.span(
				name=f"tool_{func.__name__}",
				parent_id=self.session_id
			)
			try:
				result = func(*args, **kwargs)
				span.update(
					input={"args": str(args), "kwargs": str(kwargs)},
					output=str(result)
				)
				return result
			except Exception as e:
				span.update(error=str(e))
				raise
			finally:
				try:
					span.end()
				except:
					pass
		return wrapper

	def _load_yaml(self, filename: str) -> Dict:
		"""Load and parse a YAML configuration file"""
		span = langfuse.span(
			name="_load_yaml",
			parent_id=self.session_id
		)
		try:
			filepath = os.path.join(self.config_dir, filename)
			with open(filepath, 'r') as f:
				result = yaml.safe_load(f)
				span.update(
					input={"filename": filename},
					output=str(result)
				)
				return result
		except Exception as e:
			span.update(error=str(e))
			raise
		finally:
			try:
				span.end()
			except:
				pass

	def _create_agents(self) -> Dict[str, Agent]:
		"""Create agents from configuration"""
		span = langfuse.span(
			name="_create_agents",
			parent_id=self.session_id
		)
		try:
			agents = {}
			for agent_id, config in self.agents_config.items():
				if agent_id in ['sitemap_maintainer', 'docs_validator']:
					agent_tools = [self.tools[tool] for tool in config.get('tools', [])]
					agents[agent_id] = Agent(
						role=config['role'],
						goal=config['goal'],
						backstory=config['backstory'],
						verbose=True,
						allow_delegation=False,
						tools=agent_tools,
						llm="claude-3-opus-20240229"
					)
			span.update(
				input={"agent_config": str(self.agents_config)},
				output=str(agents)
			)
			return agents
		except Exception as e:
			span.update(error=str(e))
			raise
		finally:
			try:
				span.end()
			except:
				pass

	def _create_tasks(self) -> List[Task]:
		"""Create tasks from configuration"""
		span = langfuse.span(
			name="_create_tasks",
			parent_id=self.session_id
		)
		try:
			tasks = []
			task_configs = {k: v for k, v in self.tasks_config.items() 
						if k in ['sitemap_task', 'validation_task']}
			
			current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
			
			for task_id, config in task_configs.items():
				description = config['description'].format(
					root_path='/Users/jhs/Projects/sfh',
					current_time=current_time
				)
				
				expected_output = config['expected_output']
				if 'timestamp' in expected_output.lower():
					expected_output = expected_output.replace('{current_time}', current_time)
				
				task = Task(
					description=description,
					expected_output=expected_output,
					agent=self.agents[config['agent']],
					output_file=config.get('output_file')
				)
				tasks.append(task)
			span.update(
				input={"task_configs": str(task_configs)},
				output=str(tasks)
			)
			return tasks
		except Exception as e:
			span.update(error=str(e))
			raise
		finally:
			try:
				span.end()
			except:
				pass

	def crew(self) -> TracedCrew:
		"""Creates and executes the Documentation Maintenance crew"""
		span = langfuse.span(
			name="crew_creation",
			parent_id=self.session_id
		)
		try:
			crew = TracedCrew(
				agents=list(self.agents.values()),
				tasks=self.tasks,
				process=Process.sequential,
				verbose=True
			)
			# Set the session ID after creation
			crew.set_session_id(self.session_id)
			
			span.update(
				input={"agents": str(self.agents), "tasks": str(self.tasks)},
				output=str(crew)
			)
			return crew
		except Exception as e:
			span.update(error=str(e))
			raise
		finally:
			try:
				span.end()
			except:
				pass

	def __del__(self):
		"""Ensure the parent trace is ended when the object is destroyed"""
		if hasattr(self, 'trace'):
			try:
				self.trace.end(
					metadata={
						"session_end": datetime.now().isoformat()
					}
				)
			except:
				pass
