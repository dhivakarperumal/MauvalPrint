const http = require('http');

const payload = JSON.stringify({
  title: 'Test Product',
  name: 'Test',
  category: 'TestCat',
  color: ['Black'],
  size: ['M'],
  mrp: 1000,
  sale_price: 800,
  stock: 10,
  images: [],
  images_by_variant: { 'Black-M': ['http://localhost:5000/uploads/products/test1.jpg'] },
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/products',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', data);
  });
});

req.on('error', (e) => console.error('Request error:', e));
req.write(payload);
req.end();
