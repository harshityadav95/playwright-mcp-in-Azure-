# Playwright MCP Server in Docker

A Model Context Protocol (MCP) server running Playwright in a Docker container. This server provides browser automation capabilities through the MCP protocol, enabling LLMs to interact with web pages.

## 🚀 What is MCP?

The [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) is an open protocol that standardizes how applications provide context to LLMs. This implementation provides a Playwright-based MCP server that can be run in Docker containers on any Linux system.

## ✨ Features

- **Full Playwright MCP Support**: All browser automation tools from [@playwright/mcp](https://github.com/microsoft/playwright-mcp)
- **Docker Ready**: Pre-built Docker image for easy deployment
- **HTTP/SSE Transport**: Accessible via HTTP with Server-Sent Events
- **OpenAPI/Swagger Documentation**: Interactive API documentation at `/api-docs`
- **Port 8080**: Standard port for easy integration (binds to 0.0.0.0, accessible via localhost)
- **VSCode Integration**: Ready-to-use MCP configuration for VSCode
- **Azure Compatible**: Ready for Azure Container Instances, Azure App Service, and GitHub Packages

## 📋 Prerequisites

- Docker installed and running
- Port 8080 available

## 🔧 Quick Start

### 1. Build the Docker Image

```bash
docker build -t playwright-mcp .
```

### 2. Run the Container

```bash
docker run -d -p 8080:8080 --name playwright-mcp-server playwright-mcp
```

### 3. Verify the Server

Check that the server is running:

```bash
docker logs playwright-mcp-server
```

You should see:
```
🎭 Playwright MCP Server started
📡 Listening on http://0.0.0.0:8080
🔧 Available endpoints:
   - GET  /health       - Health check
   - GET  /capabilities - List MCP capabilities
   - GET  /mcp          - MCP SSE stream (establish connection)
   - POST /messages     - MCP messages (with sessionId parameter)
   - GET  /api-docs     - OpenAPI/Swagger documentation
   - GET  /api-docs.json - OpenAPI specification (JSON)

✨ Server ready to accept connections!
```

## 📡 API Endpoints

### OpenAPI/Swagger Documentation

Access the interactive API documentation:
```bash
# Open in browser
http://localhost:8080/api-docs

# Get OpenAPI spec JSON
curl http://localhost:8080/api-docs.json
```

The Swagger UI provides:
- Interactive API exploration
- Request/response examples
- Schema definitions
- Tool descriptions
- Try-it-out functionality

### Health Check
```bash
curl http://localhost:8080/health
```

Response:
```json
{
  "status": "ok",
  "service": "Playwright MCP Server",
  "version": "1.0.0",
  "port": "8080",
  "endpoints": {
    "mcp": "/mcp",
    "health": "/health",
    "capabilities": "/capabilities",
    "swagger": "/api-docs",
    "openapi": "/api-docs.json"
  }
}
```

### List MCP Server Capabilities

**Get all available Playwright tools:**

```bash
curl http://localhost:8080/capabilities
```

Response (excerpt):
```json
{
  "tools": [
    {
      "name": "browser_navigate",
      "description": "Navigate to a URL"
    },
    {
      "name": "browser_snapshot",
      "description": "Capture accessibility snapshot of the current page"
    },
    {
      "name": "browser_click",
      "description": "Perform click on a web page"
    },
    {
      "name": "browser_type",
      "description": "Type text into editable element"
    },
    {
      "name": "browser_fill_form",
      "description": "Fill multiple form fields"
    },
    {
      "name": "browser_take_screenshot",
      "description": "Take a screenshot of the current page"
    }
  ],
  "protocol": "MCP",
  "transport": "SSE"
}
```

### MCP Protocol Endpoint

The MCP endpoint uses Server-Sent Events (SSE) transport with a two-step process:

**Step 1: Establish SSE Stream (GET)**
```bash
# GET request to establish the SSE stream and receive sessionId
curl http://localhost:8080/mcp
```

This returns an SSE stream with an endpoint event containing the sessionId:
```
event: endpoint
data: /messages?sessionId=<session-id>
```

**Step 2: Send Messages (POST)**
```bash
# POST request to send JSON-RPC messages using the sessionId
curl -X POST "http://localhost:8080/messages?sessionId=<session-id>" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    },
    "id": 1
  }'
```

## 🔌 Available MCP Tools

The server provides all standard Playwright MCP tools:

**Navigation & Pages:**
- `browser_navigate` - Navigate to a URL
- `browser_navigate_back` - Go back to the previous page
- `browser_close` - Close the browser page

**Interaction:**
- `browser_click` - Click on elements
- `browser_type` - Type text into fields
- `browser_fill_form` - Fill multiple form fields
- `browser_hover` - Hover over elements
- `browser_drag` - Drag and drop
- `browser_press_key` - Press keyboard keys
- `browser_select_option` - Select dropdown options

**Information:**
- `browser_snapshot` - Get accessibility snapshot
- `browser_take_screenshot` - Capture screenshots
- `browser_console_messages` - Get console logs
- `browser_network_requests` - Get network requests

**Dialogs & Files:**
- `browser_handle_dialog` - Handle alerts/prompts
- `browser_file_upload` - Upload files

**Advanced:**
- `browser_evaluate` - Execute JavaScript
- `browser_resize` - Resize browser window
- `browser_wait_for` - Wait for conditions

For complete tool documentation, see the [official Playwright MCP documentation](https://github.com/microsoft/playwright-mcp).

## 🐳 Docker Commands

| Action | Command |
|--------|---------|
| **Build Image** | `docker build -t playwright-mcp .` |
| **Run Container** | `docker run -d -p 8080:8080 --name playwright-mcp-server playwright-mcp` |
| **Check Status** | `docker ps` |
| **View Logs** | `docker logs playwright-mcp-server` |
| **Stop Container** | `docker stop playwright-mcp-server` |
| **Remove Container** | `docker rm playwright-mcp-server` |
| **Health Check** | `curl http://localhost:8080/health` |
| **List Capabilities** | `curl http://localhost:8080/capabilities` |

## 🌐 Using with MCP Clients

### VS Code / Cursor / GitHub Copilot

This server can be connected as an MCP server to VSCode, Cursor, or GitHub Copilot. A pre-configured `.vscode/mcp-settings.json` file is included in this repository.

**Configuration Options:**

#### Option 1: Connect to Running Docker Container (HTTP/SSE)
```json
{
  "mcpServers": {
    "playwright-http": {
      "url": "http://localhost:8080/mcp",
      "transport": "sse"
    }
  }
}
```

#### Option 2: Auto-start Docker Container
```json
{
  "mcpServers": {
    "playwright-docker": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-p",
        "8080:8080",
        "playwright-mcp"
      ],
      "env": {
        "PORT": "8080",
        "HOST": "0.0.0.0"
      }
    }
  }
}
```

**Setup Steps:**

1. **Build the Docker image** (if not already built):
   ```bash
   docker build -t playwright-mcp .
   ```

2. **Start the container**:
   ```bash
   docker run -d -p 8080:8080 --name playwright-mcp-server playwright-mcp
   ```

3. **Configure VSCode**:
   - Copy `.vscode/mcp-settings.json` to your project or VSCode settings
   - Or add the configuration to your VSCode settings JSON
   - Reload VSCode/Cursor to activate the MCP connection

4. **Verify Connection**:
   - The MCP server should appear in your Copilot/AI assistant tools
   - You should see Playwright browser automation tools available
   - Test with a simple command like "Navigate to https://example.com"

**Reference:** [Microsoft Playwright MCP Documentation](https://github.com/microsoft/playwright-mcp)

### Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "playwright": {
      "url": "http://localhost:8080/mcp"
    }
  }
}
```

### Any MCP Client

The server is accessible at:
```
http://localhost:8080/mcp
```

## 📦 GitHub Packages

To use the image from GitHub Container Registry:

### Build and Push

```bash
# Tag the image
docker tag playwright-mcp ghcr.io/harshityadav95/playwright-mcp:latest

# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Push the image
docker push ghcr.io/harshityadav95/playwright-mcp:latest
```

### Pull and Run

```bash
# Pull from GitHub Packages
docker pull ghcr.io/harshityadav95/playwright-mcp:latest

# Run the container
docker run -d -p 8080:8080 --name playwright-mcp-server ghcr.io/harshityadav95/playwright-mcp:latest
```

## ☁️ Azure Deployment

### Azure Container Instances

```bash
az container create \
  --resource-group myResourceGroup \
  --name playwright-mcp-server \
  --image ghcr.io/harshityadav95/playwright-mcp:latest \
  --dns-name-label playwright-mcp \
  --ports 8080
```

### Azure App Service

```bash
az webapp create \
  --resource-group myResourceGroup \
  --plan myAppServicePlan \
  --name playwright-mcp-app \
  --deployment-container-image-name ghcr.io/harshityadav95/playwright-mcp:latest
```

## 🛠️ Development

### Local Development (without Docker)

```bash
# Install dependencies
npm install

# Start the server
npm start
```

The server will be available at http://localhost:8080

### Run Tests

```bash
npm test
```

## 🏗️ Project Structure

```
.
├── Dockerfile          # Docker image configuration
├── index.js           # MCP server implementation
├── package.json       # Dependencies
├── test.js           # Test suite
└── README.md         # This file
```

## 📝 Environment Variables

- `PORT` - Server port (default: 8080)
- `HOST` - Server host (default: 0.0.0.0)
- `NODE_ENV` - Node environment (default: production)

## 🔒 Security Notes

- The server runs with `--no-sandbox` flag for Docker compatibility
- Consider using network policies to restrict access in production
- Use HTTPS in production environments

## 🤝 Contributing

Issues and pull requests are welcome!

## 📚 References

- [Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Playwright Documentation](https://playwright.dev)

## 📄 License

ISC

## 👤 Author

**harshityadav95**
- GitHub: [@harshityadav95](https://github.com/harshityadav95)

---

**Happy Automating! 🎭🐳**
