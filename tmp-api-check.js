const http = require('http');

const url = 'http://localhost:5000/api/teams';

const req = http.get(url, (res) => {
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log('STATUS', res.statusCode);
    console.log(body);
  });
});
req.on('error', (error) => {
  console.error('ERR', error.message);
});
