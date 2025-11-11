# Use the official Playwright MCP image from Docker Hub.
FROM mcp/playwright:latest

# Set the working directory.
WORKDIR /app

# Copy the entrypoint script.
COPY entrypoint.sh .

# The command to run the Playwright MCP server.
ENTRYPOINT ["/bin/sh", "./entrypoint.sh"]
