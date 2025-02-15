#!/usr/bin/env python3

import argparse
import os
from docs_review_agent import DocsReviewAgent
import logging
from crewai import Crew, Task
import agentops


def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )


def create_docs_review_crew(agent, session, file_path=None, dir_path=None):
    """Creates a CrewAI crew for documentation review."""
    tasks = []

    if file_path:
        tasks.append(
            Task(
                description=f"Review documentation quality for file: {file_path}",
                agent=agent.crewai_agent,
                expected_output="A comprehensive quality report for the documentation file",
            )
        )
    elif dir_path:
        tasks.append(
            Task(
                description=f"Review documentation quality for all files in directory: {dir_path}",
                agent=agent.crewai_agent,
                expected_output="A comprehensive quality report for all documentation files in the directory",
            )
        )

    # Create the crew
    crew = Crew(agents=[agent.crewai_agent], tasks=tasks, verbose=True)

    # Track the crew with AgentOps
    session.track_crew(
        crew_id="docs_review_crew",
        metadata={
            "purpose": "Documentation Quality Review",
            "target": file_path or dir_path,
        },
    )

    return crew


def main():
    parser = argparse.ArgumentParser(description="Documentation Quality Review Tool")
    parser.add_argument(
        "--github-token",
        help="GitHub token for Giscus integration (optional)",
        default=os.getenv("GITHUB_TOKEN"),
    )
    parser.add_argument(
        "--post-to-github",
        action="store_true",
        help="Post results to GitHub Discussions via Giscus",
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Single file review command
    file_parser = subparsers.add_parser(
        "file", help="Review a single documentation file"
    )
    file_parser.add_argument("file_path", help="Path to the documentation file")
    file_parser.add_argument(
        "--repo-name",
        help='GitHub repository name (e.g., "owner/repo"), required if posting to GitHub',
    )
    file_parser.add_argument(
        "--discussion-category",
        help="GitHub Discussions category ID, required if posting to GitHub",
    )

    # Directory review command
    dir_parser = subparsers.add_parser(
        "directory", help="Review all documentation files in a directory"
    )
    dir_parser.add_argument("dir_path", help="Path to the documentation directory")
    dir_parser.add_argument(
        "--repo-name",
        help='GitHub repository name (e.g., "owner/repo"), required if posting to GitHub',
    )
    dir_parser.add_argument(
        "--discussion-category",
        help="GitHub Discussions category ID, required if posting to GitHub",
    )

    args = parser.parse_args()

    if args.post_to_github:
        if not args.github_token:
            print(
                "Error: GitHub token is required when posting to GitHub. Set it via --github-token or GITHUB_TOKEN environment variable"
            )
            return 1
        if not args.repo_name or not args.discussion_category:
            print(
                "Error: --repo-name and --discussion-category are required when posting to GitHub"
            )
            return 1

    setup_logging()

    # Initialize AgentOps with correct parameters and store the session
    session = agentops.init(skip_auto_end_session=True)  # Only use valid parameters

    # Create the docs review agent
    agent = DocsReviewAgent(
        github_token=args.github_token if args.post_to_github else "dummy_token"
    )

    try:
        if args.command == "file":
            # Create and run crew for single file review
            crew = create_docs_review_crew(agent, session, file_path=args.file_path)
            result = crew.kickoff()

            # Post to GitHub if requested
            if args.post_to_github and result:
                posted = agent.post_to_giscus(
                    args.repo_name, args.discussion_category, result
                )
                print(f"Posted to GitHub: {posted}")

        elif args.command == "directory":
            # Create and run crew for directory review
            crew = create_docs_review_crew(agent, session, dir_path=args.dir_path)
            result = crew.kickoff()

            # Post to GitHub if requested
            if args.post_to_github and result:
                posted = agent.post_to_giscus(
                    args.repo_name, args.discussion_category, result
                )
                print(f"Posted to GitHub: {posted}")

        else:
            print("Error: Please specify a command ('file' or 'directory')")
            return 1

        # Print results
        if result:
            print("\nQuality Review Results:")
            print(result)
            return 0
        else:
            print("\nError: No results returned from the crew")
            return 1

    except Exception as e:
        print(f"Error: {str(e)}")
        return 1


if __name__ == "__main__":
    exit(main())
