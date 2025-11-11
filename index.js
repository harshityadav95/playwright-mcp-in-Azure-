#!/usr/bin/env node
/**
 * Playwright MCP Server
 * 
 * A Model Context Protocol (MCP) server that provides browser automation
 * capabilities using Playwright. This server runs on port 8080 and exposes
 * MCP tools via HTTP/SSE transport.
 */

const http = require('http');
const url = require('url');
const { createConnection } = require('@playwright/mcp');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

// Track active connections
const connections = new Set();

// OpenAPI/Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Playwright MCP Server API',
      version: '1.0.0',
      description: 'A Model Context Protocol (MCP) server that provides browser automation capabilities using Playwright. This server exposes MCP tools via HTTP/SSE transport for integration with AI assistants and automation tools.',
      contact: {
        name: 'GitHub Repository',
        url: 'https://github.com/harshityadav95/playwright-mcp-in-Azure-'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Local development server'
      },
      {
        url: `http://0.0.0.0:${PORT}`,
        description: 'Docker container server'
      }
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check and status endpoints'
      },
      {
        name: 'MCP',
        description: 'Model Context Protocol endpoints'
      },
      {
        name: 'Capabilities',
        description: 'MCP tools and capabilities'
      }
    ],
    components: {
      schemas: {
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'ok'
            },
            service: {
              type: 'string',
              example: 'Playwright MCP Server'
            },
            version: {
              type: 'string',
              example: '1.0.0'
            },
            port: {
              type: 'number',
              example: 8080
            },
            endpoints: {
              type: 'object',
              properties: {
                mcp: {
                  type: 'string',
                  example: '/mcp'
                },
                health: {
                  type: 'string',
                  example: '/health'
                },
                capabilities: {
                  type: 'string',
                  example: '/capabilities'
                }
              }
            }
          }
        },
        MCPTool: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'browser_navigate'
            },
            description: {
              type: 'string',
              example: 'Navigate to a URL'
            }
          }
        },
        CapabilitiesResponse: {
          type: 'object',
          properties: {
            tools: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/MCPTool'
              }
            },
            protocol: {
              type: 'string',
              example: 'MCP'
            },
            transport: {
              type: 'string',
              example: 'SSE'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Not Found'
            },
            message: {
              type: 'string',
              example: 'Available endpoints: /health, /capabilities, /mcp'
            }
          }
        }
      }
    },
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Health check endpoint',
          description: 'Returns the server status and available endpoints',
          responses: {
            '200': {
              description: 'Server is healthy and running',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/HealthResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/capabilities': {
        get: {
          tags: ['Capabilities'],
          summary: 'List MCP capabilities',
          description: 'Returns all available Playwright MCP tools and their descriptions',
          responses: {
            '200': {
              description: 'List of available MCP tools',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/CapabilitiesResponse'
                  }
                }
              }
            },
            '500': {
              description: 'Error retrieving capabilities',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/mcp': {
        post: {
          tags: ['MCP'],
          summary: 'MCP protocol endpoint (SSE)',
          description: 'Server-Sent Events (SSE) endpoint for Model Context Protocol communication. Connect MCP clients to this endpoint to access Playwright browser automation tools.',
          requestBody: {
            description: 'MCP protocol messages',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    jsonrpc: {
                      type: 'string',
                      example: '2.0'
                    },
                    method: {
                      type: 'string',
                      example: 'tools/call'
                    },
                    params: {
                      type: 'object'
                    },
                    id: {
                      type: 'number',
                      example: 1
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'SSE stream established',
              content: {
                'text/event-stream': {
                  schema: {
                    type: 'string'
                  }
                }
              }
            },
            '500': {
              description: 'Error establishing MCP connection',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ErrorResponse'
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./index.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Helper function to serve Swagger UI
function serveSwaggerUI(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Serve Swagger spec JSON
  if (pathname === '/api-docs.json' || pathname === '/swagger.json') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(swaggerSpec, null, 2));
    return true;
  }

  // Serve Swagger UI HTML with CDN assets (standalone)
  if (pathname === '/api-docs' || pathname === '/api-docs/') {
    const swaggerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Playwright MCP API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; padding:0; }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        spec: ${JSON.stringify(swaggerSpec)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
      window.ui = ui;
    }
  </script>
</body>
</html>
    `;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(swaggerHtml);
    return true;
  }

  return false;
}

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

  // Swagger UI endpoints
  if (serveSwaggerUI(req, res)) {
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
        capabilities: '/capabilities',
        swagger: '/api-docs',
        openapi: '/api-docs.json'
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
          launchOptions: { 
            headless: true,
            channel: undefined  // Use bundled Chromium instead of Chrome
          },
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
            channel: undefined,  // Use bundled Chromium instead of Chrome
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
  res.end(JSON.stringify({ error: 'Not Found', message: 'Available endpoints: /health, /capabilities, /mcp, /api-docs' }));
});

// Start server
server.listen(PORT, HOST, () => {
  console.log(`🎭 Playwright MCP Server started`);
  console.log(`📡 Listening on http://${HOST}:${PORT}`);
  console.log(`🔧 Available endpoints:`);
  console.log(`   - GET  /health       - Health check`);
  console.log(`   - GET  /capabilities - List MCP capabilities`);
  console.log(`   - POST /mcp          - MCP protocol endpoint (SSE)`);
  console.log(`   - GET  /api-docs     - OpenAPI/Swagger documentation`);
  console.log(`   - GET  /api-docs.json - OpenAPI specification (JSON)`);
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
