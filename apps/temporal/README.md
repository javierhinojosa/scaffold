# Temporal Flask Server

A Flask application that integrates with Temporal for workflow orchestration.

## Setup

1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

1. Start the Temporal server (in a separate terminal):
   ```bash
   temporal server start-dev
   ```

2. Start the Temporal worker (in a separate terminal):
   ```bash
   python worker.py
   ```

3. Start the Flask application:
   ```bash
   python app.py
   ```

## Available Endpoints

- `GET /health` - Health check endpoint
- `GET /workflows` - List all workflows
- `GET /workflow/<workflow_id>` - Get workflow status
- `POST /workflow` - Start a new workflow

## Example Usage

Start a new workflow:
```bash
curl -X POST http://localhost:5000/workflow \
  -H "Content-Type: application/json" \
  -d '{"name": "World"}'
```

Check workflow status:
```bash
curl http://localhost:5000/workflow/your-workflow-id
```

List all workflows:
```bash
curl http://localhost:5000/workflows
``` 