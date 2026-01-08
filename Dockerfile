FROM mcr.microsoft.com/playwright:v1.56.1-jammy

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (disable strict SSL for corporate proxies)
RUN npm config set strict-ssl false && npm install


# Ensure Playwright browsers are installed (chromium is sufficient for this server)
# The base image has browsers, but we explicitly install to ensure consistency
RUN npx playwright install chromium --with-deps || true


# Copy application code
COPY index.js ./

# Create output directory for screenshots/traces
RUN mkdir -p /tmp/playwright-output && chmod 777 /tmp/playwright-output

# Expose port 8080
EXPOSE 8080

# Set environment variables
ENV PORT=8080
ENV HOST=0.0.0.0
ENV NODE_ENV=production
LABEL org.opencontainers.image.version="latest"

# Run the MCP server
CMD ["node", "index.js"]
