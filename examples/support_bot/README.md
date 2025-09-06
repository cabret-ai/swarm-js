# Support bot

This example is a customer service bot which includes a user interface agent and a help center agent with several tools.
This example uses the helper function `run_demo_loop`, which allows us to create an interactive Swarm session.

## Overview

The support bot consists of two main agents:

1. **User Interface Agent**: Handles initial user interactions and directs them to the help center agent based on their needs.
2. **Help Center Agent**: Provides detailed help and support using various tools and integrated with a Qdrant VectorDB for documentation retrieval.

## Setup

To start the support bot:

### Prerequisites

1. **Docker**: Ensure Docker Desktop is installed and running
   - macOS: `open -a Docker` or start Docker Desktop from Applications
   - Linux: `sudo systemctl start docker`
   - Windows: Start Docker Desktop from the Start menu

2. **OpenAI API Key**: Set your OpenAI API key as an environment variable:
   ```shell
   export OPENAI_API_KEY=your-api-key-here
   ```

### Installation Steps

1. **Install dependencies**:
   ```shell
   make install
   # Or manually: npm install
   ```

2. **Start Qdrant vector database**:
   ```shell
   docker-compose up -d
   
   # Verify Qdrant is running:
   docker ps
   # You should see a container named 'qdrant/qdrant:v1.3.0' running on port 6335
   ```

3. **Prepare the vector database** (loads OpenAI documentation):
   ```shell
   make prep
   # Or manually: node prepData.js
   ```

4. **Run the support bot**:
   ```shell
   make run
   # Or manually: node main.js
   ```

### Troubleshooting

- **Docker connection error**: If you see "Cannot connect to the Docker daemon", ensure Docker Desktop is running
- **ECONNREFUSED error**: If you see connection refused errors, wait a few seconds for Qdrant to fully start, then retry `make prep`
- **OpenAI API errors**: Ensure your OPENAI_API_KEY is set correctly
- **Port conflicts**: If port 6335 is already in use, stop the conflicting service or modify the port in docker-compose.yaml

### Usage

Once running, you can:
- Ask general questions to the User Interface Agent
- Request to be transferred to the Help Center Agent for detailed assistance
- The Help Center Agent can search the knowledge base (vector DB) for OpenAI documentation
- Example: "Transfer me to help center" → "Why was my DALL-E 2 account deactivated?"