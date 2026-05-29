const http = require('node:http');
const data = JSON.stringify({ username:'apitest', email:'apitest_' + Date.now() + '@example.com', phone:'1112223333', password:'Test1234', confirmPassword:'Test1234' });
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};
const req = http.request(options, (res) => {
  console.log('status', res.statusCode);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => { console.log(body); process.exit(0); });
});
req.on('error', e => { console.error('request error', e); process.exit(1); });
req.write(data);
req.end();
