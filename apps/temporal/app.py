from flask import Flask, jsonify, request
from temporalio.client import Client
import asyncio
from dotenv import load_dotenv
import os
from concurrent.futures import ThreadPoolExecutor

# Load environment variables
load_dotenv()

app = Flask(__name__)
executor = ThreadPoolExecutor()

# Global variable to store the Temporal client
temporal_client = None


async def init_temporal_client():
    """Initialize the Temporal client"""
    return await Client.connect("localhost:7233")


def get_temporal_client():
    """Get or create the Temporal client"""
    global temporal_client
    if temporal_client is None:
        # Run the async initialization in a sync context
        loop = asyncio.new_event_loop()
        temporal_client = loop.run_until_complete(init_temporal_client())
    return temporal_client


# Initialize the client when the app starts
with app.app_context():
    get_temporal_client()


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "temporal-flask"})


@app.route("/workflows", methods=["GET"])
def list_workflows():
    """List all workflows"""
    try:
        client = get_temporal_client()
        # This is a placeholder - you would implement actual workflow listing logic here
        return jsonify(
            {
                "status": "success",
                "message": "Temporal client connected successfully",
                "endpoint": "/workflows",
            }
        )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/workflow/<workflow_id>", methods=["GET"])
def get_workflow(workflow_id):
    """Get workflow status by ID"""
    try:
        client = get_temporal_client()
        # This is a placeholder - you would implement actual workflow status checking logic here
        return jsonify(
            {
                "status": "success",
                "workflow_id": workflow_id,
                "message": f"Retrieved workflow {workflow_id}",
            }
        )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/workflow", methods=["POST"])
def start_workflow():
    """Start a new workflow"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        # This is a placeholder - you would implement actual workflow starting logic here
        return jsonify(
            {
                "status": "success",
                "message": "Workflow started successfully",
                "data": data,
            }
        )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
