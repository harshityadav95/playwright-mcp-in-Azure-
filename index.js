#!/usr/bin/env node
/**
 * Playwright MCP Server
 * 
 * A Model Context Protocol (MCP) server that provides browser automation
 * capabilities using Playwright. This server runs on port 8080 and exposes
 * MCP tools via HTTP/SSE transport.
 */

const http = require('http');
const { createConnection } = require('@playwright/mcp');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

// Track active connections
const connections = new Set();

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'Playwright MCP Server',
      version: '1.0.0',
      port: PORT,
      endpoints: {
        mcp: '/mcp',
        health: '/health',
        capabilities: '/capabilities'
      }
    }));
    return;
  }

  // MCP capabilities endpoint (for listing available tools)
  if (req.url === '/capabilities') {
    try {
      // Create a temporary connection to get capabilities
      const connection = await createConnection({
        browser: {
          launchOptions: { headless: true },
          browserName: 'chromium'
        }
      });
      
      const capabilities = {
        tools: [
          { name: 'browser_navigate', description: 'Navigate to a URL' },
          { name: 'browser_snapshot', description: 'Capture accessibility snapshot of the current page' },
          { name: 'browser_click', description: 'Perform click on a web page' },
          { name: 'browser_type', description: 'Type text into editable element' },
          { name: 'browser_fill_form', description: 'Fill multiple form fields' },
          { name: 'browser_take_screenshot', description: 'Take a screenshot of the current page' },
          { name: 'browser_evaluate', description: 'Evaluate JavaScript expression on page or element' },
          { name: 'browser_close', description: 'Close the page' },
          { name: 'browser_console_messages', description: 'Returns all console messages' },
          { name: 'browser_network_requests', description: 'Returns all network requests since loading the page' },
          { name: 'browser_hover', description: 'Hover over element on page' },
          { name: 'browser_select_option', description: 'Select an option in a dropdown' },
          { name: 'browser_press_key', description: 'Press a key on the keyboard' },
          { name: 'browser_drag', description: 'Perform drag and drop between two elements' },
          { name: 'browser_file_upload', description: 'Upload one or multiple files' },
          { name: 'browser_handle_dialog', description: 'Handle a dialog' },
          { name: 'browser_resize', description: 'Resize the browser window' },
          { name: 'browser_navigate_back', description: 'Go back to the previous page' },
          { name: 'browser_wait_for', description: 'Wait for text to appear or disappear or a specified time to pass' }
        ],
        protocol: 'MCP',
        transport: 'SSE'
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(capabilities, null, 2));
    } catch (error) {
      console.error('Error getting capabilities:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to get capabilities', message: error.message }));
    }
    return;
  }

  // MCP endpoint
  if (req.url === '/mcp' || req.url.startsWith('/mcp/')) {
    try {
      // Create MCP connection with Playwright
      const connection = await createConnection({
        browser: {
          launchOptions: { 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          },
          browserName: 'chromium'
        }
      });

      // Create SSE transport
      const transport = new SSEServerTransport('/mcp', res);
      
      // Track connection
      connections.add(connection);
      
      // Connect MCP server to transport
      await connection.connect(transport);

      // Clean up on close
      res.on('close', () => {
        connections.delete(connection);
        console.log('Client disconnected');
      });

      console.log('MCP client connected via SSE');
    } catch (error) {
      console.error('Error handling MCP connection:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to establish MCP connection', message: error.message }));
    }
    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found', message: 'Available endpoints: /health, /capabilities, /mcp' }));
});

// Start server
server.listen(PORT, HOST, () => {
  console.log(`🎭 Playwright MCP Server started`);
  console.log(`📡 Listening on http://${HOST}:${PORT}`);
  console.log(`🔧 Available endpoints:`);
  console.log(`   - GET  /health       - Health check`);
  console.log(`   - GET  /capabilities - List MCP capabilities`);
  console.log(`   - POST /mcp          - MCP protocol endpoint (SSE)`);
  console.log(`\n✨ Server ready to accept connections!`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
