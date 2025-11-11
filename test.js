const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');

const execPromise = promisify(exec);
const containerName = 'playwright-mcp-test';
const imageName = 'playwright-mcp';
const port = 8080;

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
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

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

async function waitForServer(url, maxAttempts = 20, delayMs = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      logInfo(`Attempting to connect to server (attempt ${i + 1}/${maxAttempts})...`);
      const response = await fetch(url, { timeout: 2000 });
      if (response.ok || response.status === 200) {
        logSuccess('Server is responding!');
        return true;
      }
    } catch (error) {
      // Server not ready yet, wait and retry
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  return false;
}

async function checkDockerImage() {
  logInfo('Checking if Docker image exists...');
  try {
    const { stdout } = await execPromise(`docker images ${imageName} --format "{{.Repository}}:{{.Tag}}"`);
    if (stdout.trim()) {
      logSuccess(`Docker image '${imageName}' found`);
      return true;
    } else {
      logError(`Docker image '${imageName}' not found`);
      return false;
    }
  } catch (error) {
    logError(`Failed to check Docker image: ${error.message}`);
    return false;
  }
}

async function cleanupContainer() {
  logInfo('Cleaning up any existing test containers...');
  try {
    await execPromise(`docker stop ${containerName} 2>/dev/null || true`);
    await execPromise(`docker rm ${containerName} 2>/dev/null || true`);
    logSuccess('Cleanup completed');
  } catch (error) {
    // Ignore cleanup errors
  }
}

async function startContainer() {
  logInfo(`Starting Docker container '${containerName}'...`);
  try {
    const { stdout } = await execPromise(`docker run -d -p ${port}:${port} --name ${containerName} ${imageName}`);
    const containerId = stdout.trim();
    logSuccess(`Container started with ID: ${containerId.substring(0, 12)}`);
    return containerId;
  } catch (error) {
    logError(`Failed to start container: ${error.message}`);
    throw error;
  }
}

async function checkContainerHealth() {
  logInfo('Checking container health...');
  try {
    const { stdout } = await execPromise(`docker ps --filter "name=${containerName}" --format "{{.Status}}"`);
    if (stdout.includes('Up')) {
      logSuccess('Container is running');
      return true;
    } else {
      logError('Container is not running');
      return false;
    }
  } catch (error) {
    logError(`Failed to check container health: ${error.message}`);
    return false;
  }
}

async function checkContainerLogs() {
  logInfo('Checking container logs...');
  try {
    const { stdout } = await execPromise(`docker logs ${containerName}`);
    console.log(colors.cyan + '--- Container Logs ---' + colors.reset);
    console.log(stdout);
    console.log(colors.cyan + '--- End of Logs ---' + colors.reset);
    
    if (stdout.includes('Server listening on port')) {
      logSuccess('Server started successfully inside container');
      return true;
    } else {
      logWarning('Server startup message not found in logs');
      return false;
    }
  } catch (error) {
    logError(`Failed to get container logs: ${error.message}`);
    return false;
  }
}

async function testServerResponse() {
  logInfo('Testing server response...');
  try {
    const url = `http://localhost:${port}/`;
    const response = await fetch(url);
    const contentType = response.headers.get('content-type');
    
    logInfo(`Response status: ${response.status}`);
    logInfo(`Content-Type: ${contentType}`);
    
    if (response.status === 200 && contentType === 'image/png') {
      const buffer = await response.buffer();
      logSuccess(`Received valid PNG image (${buffer.length} bytes)`);
      
      // Verify it's actually a PNG by checking magic number
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        logSuccess('PNG file signature verified');
        
        // Save the image for inspection
        fs.writeFileSync('test-screenshot.png', buffer);
        logInfo('Screenshot saved as test-screenshot.png');
        return true;
      } else {
        logError('Invalid PNG file signature');
        return false;
      }
    } else {
      logError(`Unexpected response: status=${response.status}, content-type=${contentType}`);
      return false;
    }
  } catch (error) {
    logError(`Server request failed: ${error.message}`);
    return false;
  }
}

async function test404Response() {
  logInfo('Testing 404 response...');
  try {
    const response = await fetch(`http://localhost:${port}/nonexistent`);
    if (response.status === 404) {
      logSuccess('404 response working correctly');
      return true;
    } else {
      logWarning(`Expected 404, got ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`404 test failed: ${error.message}`);
    return false;
  }
}

async function stopContainer() {
  logInfo('Stopping Docker container...');
  try {
    await execPromise(`docker stop ${containerName}`);
    logSuccess('Container stopped');
    
    await execPromise(`docker rm ${containerName}`);
    logSuccess('Container removed');
    return true;
  } catch (error) {
    logError(`Failed to stop/remove container: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  log('\n' + '='.repeat(60), colors.cyan);
  log('  Playwright MCP Docker Container Test Suite', colors.cyan);
  log('='.repeat(60) + '\n', colors.cyan);
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };
  
  const runTest = async (name, fn) => {
    results.total++;
    log(`\n--- Test: ${name} ---`, colors.yellow);
    try {
      const result = await fn();
      if (result) {
        results.passed++;
      } else {
        results.failed++;
      }
      return result;
    } catch (error) {
      logError(`Test threw error: ${error.message}`);
      results.failed++;
      return false;
    }
  };
  
  try {
    // Pre-test checks
    await runTest('Docker Image Check', checkDockerImage);
    await cleanupContainer();
    
    // Start container
    await runTest('Start Container', startContainer);
    
    // Wait for server to be ready
    logInfo('Waiting for server to be ready...');
    const serverReady = await waitForServer(`http://localhost:${port}/`);
    if (!serverReady) {
      logError('Server failed to start in time');
      throw new Error('Server timeout');
    }
    
    // Run tests
    await runTest('Container Health Check', checkContainerHealth);
    await runTest('Container Logs Check', checkContainerLogs);
    await runTest('Server Response Test', testServerResponse);
    await runTest('404 Response Test', test404Response);
    
  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
  } finally {
    // Cleanup
    log('\n--- Cleanup ---', colors.yellow);
    await stopContainer();
  }
  
  // Print summary
  log('\n' + '='.repeat(60), colors.cyan);
  log('  Test Summary', colors.cyan);
  log('='.repeat(60), colors.cyan);
  log(`Total Tests: ${results.total}`, colors.blue);
  log(`Passed: ${results.passed}`, colors.green);
  log(`Failed: ${results.failed}`, colors.red);
  
  if (results.failed === 0) {
    log('\n✓ All tests passed!', colors.green);
    process.exit(0);
  } else {
    log('\n✗ Some tests failed', colors.red);
    process.exit(1);
  }
}

runAllTests();
