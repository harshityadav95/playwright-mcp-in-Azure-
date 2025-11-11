# Playwright MCP Server in Docker

A Model Context Protocol (MCP) server running Playwright in a Docker container. This server provides a simple HTTP API that uses Playwright to capture screenshots of web pages.

## � Quick Commands

| Action | Command |
|--------|---------|
| **Build Image** | `docker build -t playwright-mcp .` |
| **Run Container** | `docker run -d -p 8080:8080 --name playwright-mcp-server playwright-mcp` |
| **Check Status** | `docker ps` |
| **View Logs** | `docker logs playwright-mcp-server` |
| **Test Server** | `curl http://localhost:8080/ --output test.png` |
| **Run Tests** | `node test.js` |
| **Stop Container** | `docker stop playwright-mcp-server` |
| **Remove Container** | `docker rm playwright-mcp-server` |

## �📋 Prerequisites

- Docker installed and running
- Node.js (v14 or higher) for running tests
- Git (for cloning the repository)

### Installing Docker

If you don't have Docker installed:

**macOS:**
```bash
# Using Homebrew
brew install --cask docker

# Or download Docker Desktop from:
# https://www.docker.com/products/docker-desktop
```

**Linux (Ubuntu/Debian):**
```bash
# Update package index
sudo apt-get update

# Install Docker
sudo apt-get install -y docker.io

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER

# Log out and back in for changes to take effect
```

**Linux (Fedora/RHEL/CentOS):**
```bash
sudo dnf install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

**Windows:**
```bash
# Download and install Docker Desktop from:
# https://www.docker.com/products/docker-desktop
```

**Verify Docker Installation:**
```bash
# Check Docker version
docker --version

# Test Docker is working
docker run hello-world

# Check Docker is running
docker ps
```

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/harshityadav95/playwright-mcp-in-Azure-.git
cd playwright-mcp-in-Azure-
```

### 2. Build the Docker Image

```bash
docker build -t playwright-mcp .
```

This will:
- Pull the official Playwright Docker base image (v1.56.1)
- Install Node.js dependencies
- Set up the application on port 8080

### 3. Run the Container

```bash
docker run -d -p 8080:8080 --name playwright-mcp-server playwright-mcp
```

Options explained:
- `-d`: Run in detached mode (background)
- `-p 8080:8080`: Map port 8080 from container to host
- `--name playwright-mcp-server`: Give the container a friendly name
- `playwright-mcp`: The image name we built

### 4. Verify the Server is Running

Check the container logs:

```bash
docker logs playwright-mcp-server
```

You should see:
```
Server listening on port 8080
```

## ✅ Testing & Validation

### Option 1: Automated Test Suite (Recommended)

Run the comprehensive test script that validates all functionality:

```bash
node test.js
```

This automated test suite will:
- ✓ Verify Docker image exists
- ✓ Start a test container
- ✓ Check container health
- ✓ Validate server logs
- ✓ Test Playwright screenshot functionality
- ✓ Verify API responses
- ✓ Test error handling (404 responses)
- ✓ Clean up automatically

Expected output:
```
============================================================
  Playwright MCP Docker Container Test Suite
============================================================

Total Tests: 6
Passed: 6
Failed: 0

✓ All tests passed!
```

### Option 2: Manual Testing

#### Test with cURL

```bash
# Request a screenshot (returns PNG image)
curl http://localhost:8080/ --output screenshot.png

# Check HTTP headers
curl -I http://localhost:8080/

# Test 404 response
curl http://localhost:8080/nonexistent
```

Expected response headers:
```
HTTP/1.1 200 OK
Content-Type: image/png
```

#### Test with a Web Browser

Open your browser and navigate to:
```
http://localhost:8080/
```

You should see a PNG screenshot of http://whatsmyuseragent.org/

#### Test with Node.js Script

```javascript
const fetch = require('node-fetch');
const fs = require('fs');

(async () => {
  const response = await fetch('http://localhost:8080/');
  const buffer = await response.buffer();
  fs.writeFileSync('test-output.png', buffer);
  console.log('Screenshot saved!');
})();
```

## 🔍 Validation Checklist

Use this checklist to ensure everything is working correctly:

- [ ] Docker image builds successfully
- [ ] Container starts without errors
- [ ] Server logs show "Server listening on port 8080"
- [ ] Container status shows "Up" when running `docker ps`
- [ ] HTTP request to `http://localhost:8080/` returns status 200
- [ ] Response Content-Type is `image/png`
- [ ] Screenshot file is valid and can be opened
- [ ] 404 endpoint returns proper error response

## 📊 Container Management

### View Running Containers

```bash
docker ps
```

### View Container Logs

```bash
docker logs playwright-mcp-server

# Follow logs in real-time
docker logs -f playwright-mcp-server
```

### Stop the Container

```bash
docker stop playwright-mcp-server
```

### Start the Container Again

```bash
docker start playwright-mcp-server
```

### Remove the Container

```bash
docker rm playwright-mcp-server
```

### Remove the Image

```bash
docker rmi playwright-mcp
```

### Restart Everything

```bash
# Stop and remove existing container
docker stop playwright-mcp-server && docker rm playwright-mcp-server

# Rebuild image
docker build -t playwright-mcp .

# Run new container
docker run -d -p 8080:8080 --name playwright-mcp-server playwright-mcp
```

## � Docker Commands Reference

### Essential Docker Commands

#### Image Management
```bash
# List all Docker images
docker images

# List images with specific name
docker images playwright-mcp

# Remove an image
docker rmi playwright-mcp

# Remove all unused images
docker image prune

# Remove all images (force)
docker rmi $(docker images -q) -f

# Build image with no cache
docker build --no-cache -t playwright-mcp .

# Tag an image
docker tag playwright-mcp myregistry/playwright-mcp:v1.0
```

#### Container Management
```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Start a container
docker start playwright-mcp-server

# Stop a container
docker stop playwright-mcp-server

# Restart a container
docker restart playwright-mcp-server

# Remove a container
docker rm playwright-mcp-server

# Force remove a running container
docker rm -f playwright-mcp-server

# Remove all stopped containers
docker container prune
```

#### Container Inspection
```bash
# View container logs
docker logs playwright-mcp-server

# Follow logs in real-time
docker logs -f playwright-mcp-server

# View last 50 lines of logs
docker logs --tail 50 playwright-mcp-server

# Inspect container details
docker inspect playwright-mcp-server

# View container resource usage
docker stats playwright-mcp-server

# View container processes
docker top playwright-mcp-server

# Execute command in running container
docker exec playwright-mcp-server ls -la /app

# Open interactive shell in container
docker exec -it playwright-mcp-server /bin/bash

# Copy files from container to host
docker cp playwright-mcp-server:/app/useragent.png ./local-screenshot.png

# Copy files from host to container
docker cp ./local-file.txt playwright-mcp-server:/app/
```

#### Network Management
```bash
# List Docker networks
docker network ls

# Inspect container network
docker network inspect bridge

# Create custom network
docker network create playwright-network

# Run container on specific network
docker run -d --network playwright-network --name playwright-mcp-server playwright-mcp

# Connect running container to network
docker network connect playwright-network playwright-mcp-server

# Disconnect from network
docker network disconnect playwright-network playwright-mcp-server
```

#### Volume Management
```bash
# List volumes
docker volume ls

# Create a volume
docker volume create playwright-data

# Run container with volume
docker run -d -p 8080:8080 -v playwright-data:/app/screenshots --name playwright-mcp-server playwright-mcp

# Inspect volume
docker volume inspect playwright-data

# Remove volume
docker volume rm playwright-data

# Remove all unused volumes
docker volume prune
```

#### System Management
```bash
# Show Docker disk usage
docker system df

# Remove all unused data (containers, networks, images, cache)
docker system prune

# Remove everything including volumes
docker system prune -a --volumes

# Show Docker version and info
docker version
docker info
```

#### Advanced Container Operations
```bash
# Run container with environment variables
docker run -d -p 8080:8080 -e NODE_ENV=production --name playwright-mcp-server playwright-mcp

# Run container with resource limits
docker run -d -p 8080:8080 --memory="512m" --cpus="1.0" --name playwright-mcp-server playwright-mcp

# Run container with restart policy
docker run -d -p 8080:8080 --restart=always --name playwright-mcp-server playwright-mcp

# Run container with custom hostname
docker run -d -p 8080:8080 --hostname=playwright-server --name playwright-mcp-server playwright-mcp

# Run container in foreground (see logs directly)
docker run --rm -p 8080:8080 --name playwright-mcp-server playwright-mcp

# Run container with port binding to specific interface
docker run -d -p 127.0.0.1:8080:8080 --name playwright-mcp-server playwright-mcp
```

#### Docker Compose (Optional)
If you want to use Docker Compose, create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  playwright-mcp:
    build: .
    container_name: playwright-mcp-server
    ports:
      - "8080:8080"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Then use:
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild and restart
docker-compose up -d --build
```

#### Registry Operations
```bash
# Login to Docker Hub
docker login

# Tag image for registry
docker tag playwright-mcp username/playwright-mcp:latest

# Push image to Docker Hub
docker push username/playwright-mcp:latest

# Pull image from Docker Hub
docker pull username/playwright-mcp:latest

# Login to Azure Container Registry
docker login myregistry.azurecr.io

# Tag for ACR
docker tag playwright-mcp myregistry.azurecr.io/playwright-mcp:v1.0

# Push to ACR
docker push myregistry.azurecr.io/playwright-mcp:v1.0
```

## �🛠️ Troubleshooting

### Container Won't Start

Check logs for errors:
```bash
docker logs playwright-mcp-server
```

### Port Already in Use

If port 8080 is already in use, map to a different port:
```bash
docker run -d -p 8081:8080 --name playwright-mcp-server playwright-mcp
```

Then access at `http://localhost:8081/`

### Server Returns 500 Error

Check if Playwright version matches between `package.json` and `Dockerfile`:
- `package.json`: `"playwright": "^1.56.1"`
- `Dockerfile`: `FROM mcr.microsoft.com/playwright:v1.56.1-jammy`

### Permission Denied

On Linux, you may need to run Docker commands with `sudo` or add your user to the docker group:
```bash
sudo usermod -aG docker $USER
```

Then log out and back in.

## 🏗️ Project Structure

```
.
├── Dockerfile              # Docker image configuration
├── index.js               # Node.js server with Playwright
├── package.json           # Node.js dependencies
├── package-lock.json      # Locked dependency versions
├── test.js                # Comprehensive test suite
└── README.md              # This file
```

## 🔧 API Endpoints

### `GET /`
Returns a PNG screenshot of http://whatsmyuseragent.org/

**Response:**
- Status: `200 OK`
- Content-Type: `image/png`
- Body: Binary PNG image data

### `GET /<anything-else>`
Returns a 404 error for any other endpoint

**Response:**
- Status: `404 Not Found`
- Content-Type: `text/plain`
- Body: `Not Found`

## 📝 Development

### Install Dependencies Locally

```bash
npm install
```

### Run Server Locally (without Docker)

```bash
node index.js
```

### Run Tests Against Local Server

Make sure the server is running, then:
```bash
node test.js
```

## 🌐 Deployment to Azure

This container is ready to be deployed to Azure Container Instances or Azure App Service. Make sure to:

1. Push the image to Azure Container Registry (ACR)
2. Configure appropriate port mappings
3. Set up health probes on the root endpoint

## 📄 License

ISC

## 👤 Author

**harshityadav95**
- GitHub: [@harshityadav95](https://github.com/harshityadav95)

## 🤝 Contributing

Issues and pull requests are welcome!

---

**Happy Testing! 🎭🐳**
