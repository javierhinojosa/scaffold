import asyncio
from temporalio.client import Client
from temporalio.worker import Worker
from workflows import GreetingWorkflow, say_hello


async def main():
    client = await Client.connect("localhost:7233")

    # Run the worker
    worker = Worker(
        client,
        task_queue="tutorial-task-queue",
        workflows=[GreetingWorkflow],
        activities=[say_hello],
    )

    print("Starting worker...")
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
