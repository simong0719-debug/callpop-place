const http = require('http');
const fs = require('fs');
const path = require('path');

http.createServer((req, res) => {
  const file = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); }
    else { res.writeHead(200); res.end(data); }
  });
}).listen(3000, () => console.log('Server running at http://localhost:3000'));
