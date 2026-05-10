async function test() {
  try {
    const loginRes = await fetch('http://127.0.0.1:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@sterlingmarket.local',
        password: 'admin123'
      })
    });
    const loginData = await loginRes.json();
    console.log('Login success. Token:', loginData.data?.token?.substring(0, 10));
    
    const usersRes = await fetch('http://127.0.0.1:5001/api/admin/users', {
      headers: { Authorization: `Bearer ${loginData.data.token}` }
    });
    const usersData = await usersRes.json();
    console.log('Users length:', usersData.data?.length);
    console.log('Error:', usersData.message);
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}
test();
