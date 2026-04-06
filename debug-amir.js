const http = require('http');

function fetch(url, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    };
    http.get(url, options, (res) => {
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

async function debugUser() {
  try {
    console.log('=== DEBUGGING USER "amir" ===');

    // Check all users
    console.log('\n1. Fetching all users...');
    const users = await fetch('http://localhost:5000/api/users');
    console.log('Users status:', users.status);
    console.log('Users:', JSON.stringify(users.data, null, 2));

    // Check all teams
    console.log('\n2. Fetching all teams...');
    const teams = await fetch('http://localhost:5000/api/teams');
    console.log('Teams status:', teams.status);
    console.log('Teams:', JSON.stringify(teams.data, null, 2));

    // Try to find amir user
    console.log('\n3. Looking for user "amir"...');
    let amirUser = null;
    if (users.data && Array.isArray(users.data)) {
      amirUser = users.data.find(u => u.email === 'amir' || u.name === 'amir' || u.id === 'amir');
    }
    console.log('Found amir user:', amirUser);

    if (amirUser) {
      console.log('\n4. Checking if amir is in any team...');
      if (teams.data && Array.isArray(teams.data)) {
        const amirTeams = teams.data.filter(t =>
          t.leaderId === amirUser.id ||
          (t.memberIds && t.memberIds.includes(amirUser.id)) ||
          (t.members && t.members.some(m => m.id === amirUser.id))
        );
        console.log('Teams containing amir:', amirTeams);
      }
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

debugUser();