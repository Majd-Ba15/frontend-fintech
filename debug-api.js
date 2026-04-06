const http = require('http');

function fetch(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    }).on('error', reject);
  });
}

async function test() {
  try {
    console.log('Testing API...');

    const users = await fetch('http://localhost:5000/api/users');
    console.log('Users status:', users.status);
    console.log('Users:', users.data);

    const teams = await fetch('http://localhost:5000/api/teams');
    console.log('Teams status:', teams.status);
    console.log('Teams:', teams.data);

  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();