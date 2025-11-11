#!/usr/bin/env node
/**
 * Test suite for Playwright MCP Server
 * 
 * Tests the MCP server functionality including:
 * - Docker image build
 * - Container startup
 * - Health endpoint
 * - Capabilities endpoint
 * - MCP protocol endpoint availability
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const http = require('http');

const execPromise = promisify(exec);
const containerName = 'playwright-mcp-test';
const imageName = 'playwright-mcp';
const port = 8080;

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.blue);
}

async function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    }).on('error', reject);
  });
}

async function waitForServer(url, maxAttempts = 15, delayMs = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      logInfo(`Waiting for server... (attempt ${i + 1}/${maxAttempts})`);
      const result = await httpGet(url);
      if (result.status === 200) {
        logSuccess('Server is ready!');
        return true;
      }
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  return false;
}

async function cleanupContainer() {
  try {
    await execPromise(`docker stop ${containerName} 2>/dev/null || true`);
    await execPromise(`docker rm ${containerName} 2>/dev/null || true`);
  } catch (error) {
    // Ignore cleanup errors
  }
}

async function runTests() {
  let testsPassed = 0;
  let testsFailed = 0;
  
  log('\n' + '='.repeat(60), colors.cyan);
  log('  Playwright MCP Server Test Suite', colors.bold + colors.cyan);
  log('='.repeat(60) + '\n', colors.cyan);

  // Test 1: Check if Docker image exists
  try {
    logInfo('Test 1: Checking if Docker image exists...');
    const { stdout } = await execPromise(`docker images ${imageName} --format "{{.Repository}}:{{.Tag}}"`);
    if (stdout.includes(imageName)) {
      logSuccess('Docker image exists');
      testsPassed++;
    } else {
      throw new Error('Image not found');
    }
  } catch (error) {
    logError('Docker image not found. Run: docker build -t playwright-mcp .');
    testsFailed++;
  }

  // Cleanup before starting
  await cleanupContainer();

  // Test 2: Start container
  try {
    logInfo('Test 2: Starting Docker container...');
    await execPromise(`docker run -d -p ${port}:${port} --name ${containerName} ${imageName}`);
    logSuccess('Container started successfully');
    testsPassed++;
  } catch (error) {
    logError(`Failed to start container: ${error.message}`);
    testsFailed++;
    await cleanupContainer();
    process.exit(1);
  }

  // Wait for server to be ready
  const serverReady = await waitForServer(`http://localhost:${port}/health`);
  if (!serverReady) {
    logError('Server failed to start within timeout period');
    testsFailed++;
    await cleanupContainer();
    process.exit(1);
  }

  // Test 3: Health endpoint
  try {
    logInfo('Test 3: Testing health endpoint...');
    const result = await httpGet(`http://localhost:${port}/health`);
    
    if (result.status === 200 && 
        result.data.status === 'ok' &&
        result.data.service === 'Playwright MCP Server') {
      logSuccess('Health endpoint working correctly');
      logInfo(`  → Service: ${result.data.service}`);
      logInfo(`  → Version: ${result.data.version}`);
      testsPassed++;
    } else {
      throw new Error('Invalid health response');
    }
  } catch (error) {
    logError(`Health endpoint test failed: ${error.message}`);
    testsFailed++;
  }

  // Test 4: Capabilities endpoint
  try {
    logInfo('Test 4: Testing capabilities endpoint...');
    const result = await httpGet(`http://localhost:${port}/capabilities`);
    
    if (result.status === 200 && 
        result.data.tools &&
        Array.isArray(result.data.tools) &&
        result.data.tools.length > 0) {
      logSuccess('Capabilities endpoint working correctly');
      logInfo(`  → Protocol: ${result.data.protocol}`);
      logInfo(`  → Transport: ${result.data.transport}`);
      logInfo(`  → Available tools: ${result.data.tools.length}`);
      
      // Verify some key tools exist
      const toolNames = result.data.tools.map(t => t.name);
      const expectedTools = ['browser_navigate', 'browser_snapshot', 'browser_click'];
      const hasExpectedTools = expectedTools.every(tool => toolNames.includes(tool));
      
      if (hasExpectedTools) {
        logSuccess('All expected MCP tools are available');
        testsPassed++;
      } else {
        throw new Error('Some expected tools are missing');
      }
    } else {
      throw new Error('Invalid capabilities response');
    }
  } catch (error) {
    logError(`Capabilities endpoint test failed: ${error.message}`);
    testsFailed++;
  }

  // Test 5: MCP endpoint availability (skip actual connection test)
  try {
    logInfo('Test 5: Verifying MCP endpoint is documented...');
    // The MCP endpoint is at /mcp and requires a proper MCP client to test fully
    // We verify it's mentioned in the health response instead
    const result = await httpGet(`http://localhost:${port}/health`);
    
    if (result.data.endpoints && result.data.endpoints.mcp === '/mcp') {
      logSuccess('MCP endpoint is documented and available at /mcp');
      logInfo('  → Note: MCP endpoint requires an MCP client to test fully');
      testsPassed++;
    } else {
      throw new Error('MCP endpoint not found in health response');
    }
  } catch (error) {
    logError(`MCP endpoint test failed: ${error.message}`);
    testsFailed++;
  }

  // Test 6: Container logs
  try {
    logInfo('Test 6: Checking container logs...');
    const { stdout } = await execPromise(`docker logs ${containerName}`);
    
    if (stdout.includes('Playwright MCP Server started') && 
        stdout.includes('Listening on')) {
      logSuccess('Container logs show server started correctly');
      testsPassed++;
    } else {
      throw new Error('Server startup message not found in logs');
    }
  } catch (error) {
    logError(`Container logs test failed: ${error.message}`);
    testsFailed++;
  }

  // Cleanup
  logInfo('\nCleaning up test container...');
  await cleanupContainer();
  logSuccess('Cleanup complete');

  // Summary
  log('\n' + '='.repeat(60), colors.cyan);
  log('  Test Results', colors.bold + colors.cyan);
  log('='.repeat(60), colors.cyan);
  log(`Total Tests: ${testsPassed + testsFailed}`);
  log(`Passed: ${testsPassed}`, colors.green);
  log(`Failed: ${testsFailed}`, testsFailed > 0 ? colors.red : colors.reset);
  log('='.repeat(60) + '\n', colors.cyan);

  if (testsFailed === 0) {
    log('✓ All tests passed!', colors.green + colors.bold);
    log('\nYou can now use the MCP server with:', colors.blue);
    log('  docker run -d -p 8080:8080 --name playwright-mcp-server playwright-mcp', colors.cyan);
    log('\nCurl commands to test:', colors.blue);
    log('  curl http://localhost:8080/health', colors.cyan);
    log('  curl http://localhost:8080/capabilities', colors.cyan);
    process.exit(0);
  } else {
    log('✗ Some tests failed!', colors.red + colors.bold);
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  logError(`Test suite error: ${error.message}`);
  cleanupContainer();
  process.exit(1);
});
