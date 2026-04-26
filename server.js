const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 8080;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SIGNUPS_FILE = path.join(DATA_DIR, 'signups.csv');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SIGNUPS_FILE)) {
    fs.writeFileSync(SIGNUPS_FILE, 'timestamp,email\n', 'utf-8');
  }
}

function appendSignup(email) {
  ensureDataFile();
  const row = `${new Date().toISOString()},${email}\n`;
  fs.appendFileSync(SIGNUPS_FILE, row, 'utf-8');
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (error, fileBuffer) => {
    if (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extension] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fileBuffer);
  });
}

function getSafePath(urlPath) {
  const requestedPath = urlPath === '/' ? '/index.html' : urlPath;
  const filePath = path.join(ROOT_DIR, requestedPath);
  const normalized = path.normalize(filePath);
  if (!normalized.startsWith(ROOT_DIR)) {
    return null;
  }
  return normalized;
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && parsedUrl.pathname === '/signup') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) {
        req.socket.destroy();
      }
    });

    req.on('end', () => {
      const params = new URLSearchParams(body);
      const email = (params.get('email') || '').trim().toLowerCase();

      if (!isValidEmail(email)) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Invalid email address.');
        return;
      }

      appendSignup(email);
      res.writeHead(303, { Location: '/?signup=ok' });
      res.end();
    });

    return;
  }

  if (req.method === 'GET') {
    const filePath = getSafePath(parsedUrl.pathname);
    if (!filePath) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }
    sendFile(res, filePath);
    return;
  }

  res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Method not allowed');
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
