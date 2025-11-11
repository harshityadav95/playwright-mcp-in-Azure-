# Use the official Node.js 18 image.
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# Set the working directory in the container.
WORKDIR /app

# Install Playwright browsers.
RUN npx playwright install --with-deps chromium

# Expose the port the app runs on.
EXPOSE 8080

# The command to run the Playwright MCP server.
# Note: We use 0.0.0.0 to allow connections from outside the container.
CMD ["npx", "playwright", "run-server", "--port", "8080", "--host", "0.0.0.0"]
