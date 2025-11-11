const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');

const server = http.createServer(async (req, res) => {
  if (req.url === '/') {
    try {
      const browser = await chromium.launch();
      const page = await browser.newPage();
      await page.goto('http://whatsmyuseragent.org/');
      await page.screenshot({ path: 'useragent.png' });
      await browser.close();

      const image = fs.readFileSync('useragent.png');
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(image, 'binary');
    } catch (error) {
      console.error(error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(8080, () => {
  console.log('Server listening on port 8080');
});
