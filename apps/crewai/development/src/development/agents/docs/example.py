import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from docs_review_agent import DocsReviewAgent

# Load environment variables from .env
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("DocsReviewExample")


def main():
    logger.info("Starting documentation review process")

    try:
        # Initialize the agent
        logger.info("Initializing DocsReviewAgent")
        agent = DocsReviewAgent()

        # Set up parameters
        current_file = Path(__file__)
        workspace_root = (
            current_file.parent.parent.parent.parent.parent.parent.parent
        )  # Navigate up to monorepo root
        docs_url = "/Users/jhs/Projects/sfh/apps/docs/src/content/docs/dev/stack/turborepo.mdx"  # Absolute path to local MDX file
        repo_path = "/Users/jhs/Projects/sfh"  # Path to your monorepo root
        repo_name = "javierhinojosa/scaffold"  # Replace with your GitHub repo
        discussion_category_id = (
            "DIC_kwDON4sFNc4Cm7FL"  # Replace with your GitHub Discussions category ID
        )

        logger.info(f"Configuration set:")
        logger.info(f"- Docs URL: {docs_url}")
        logger.info(f"- Repo Path: {repo_path}")
        logger.info(f"- Repo Name: {repo_name}")

        # Run the documentation review
        logger.info("Starting documentation review")
        result = agent.review_documentation(
            docs_url=docs_url,
            repo_path=repo_path,
            repo_name=repo_name,
            discussion_category_id=discussion_category_id,
        )

        # Print results
        if "error" in result:
            logger.error(f"Review failed: {result['error']}")
        else:
            logger.info("Review completed successfully!")
            logger.info(f"Found {result['discrepancies_found']} discrepancies")
            logger.info("\nGenerated Report:")
            print(result["report"])

    except Exception as e:
        logger.error(f"An unexpected error occurred: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    main()
