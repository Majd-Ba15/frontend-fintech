async function testApi() {
  try {
    const tasksRes = await fetch('http://localhost:5000/api/tasks');
    const tasks = await tasksRes.json();
    console.log('Tasks:', tasks.length > 0 ? `${tasks.length} tasks found` : 'No tasks');
    console.log('First task:', tasks[0]);
    
    const usersRes = await fetch('http://localhost:5000/api/users');
    const users = await usersRes.json();
    console.log('Users:', users.length > 0 ? `${users.length} users found` : 'No users');
  } catch (err) {
    console.error('API Error:', err.message);
  }
}

testApi();
