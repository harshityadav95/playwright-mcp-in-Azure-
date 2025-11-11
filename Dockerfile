# Use the official Playwright image from Microsoft's container registry.
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# Set the working directory.
WORKDIR /app

# Expose the port the MCP server will run on.
EXPOSE 8080

# The command to run the Playwright MCP server.
CMD ["npx", "@playwright/mcp@latest", "--port", "8080"]
