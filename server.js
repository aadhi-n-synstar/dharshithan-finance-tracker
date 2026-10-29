const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
require('dotenv').config({ path: '.env.local' });

const invoicesHandler = require('./api/invoices');
const vouchersHandler = require('./api/vouchers');
const salariesHandler = require('./api/salaries');
const auditLogsHandler = require('./api/audit-logs');
const metricsHandler = require('./api/dashboard-metrics');
const authHandler = require('./api/auth');
const healthHandler = require('./api/health');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function createMockReqRes(req, res, parsedUrl) {
  res.status = function(code) {
    res.statusCode = code;
    return res;
  };
  res.json = function(data) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  };

  req.query = parsedUrl.query || {};
  return { req, res };
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Collect request body
  let bodyBuffer = '';
  req.on('data', chunk => {
    bodyBuffer += chunk;
  });

  req.on('end', async () => {
    if (bodyBuffer) {
      try {
        req.body = JSON.parse(bodyBuffer);
      } catch (e) {
        req.body = bodyBuffer;
      }
    } else {
      req.body = {};
    }

    createMockReqRes(req, res, parsedUrl);

    // API Routes
    if (pathname === '/api/invoices') {
      return invoicesHandler(req, res);
    }
    if (pathname === '/api/vouchers') {
      return vouchersHandler(req, res);
    }
    if (pathname === '/api/salaries') {
      return salariesHandler(req, res);
    }
    if (pathname === '/api/audit-logs') {
      return auditLogsHandler(req, res);
    }
    if (pathname === '/api/dashboard-metrics') {
      return metricsHandler(req, res);
    }
    if (pathname === '/api/auth') {
      return authHandler(req, res);
    }
    if (pathname === '/api/health') {
      return healthHandler(req, res);
    }

    // Static Files (check public/ first, fallback to root)
    let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(__dirname, 'public', 'index.html');
        if (!fs.existsSync(filePath)) {
          filePath = path.join(__dirname, 'index.html');
        }
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Dharshithan Waterproofing Enterprise Ledger running at http://localhost:${PORT}`);
    console.log(`100% Neon PostgreSQL Native Engine`);
  });
}

module.exports = server;
