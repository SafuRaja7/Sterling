import dotenv from 'dotenv';
dotenv.config();

async function run() {
  try {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: 'admin-id', role: 'admin' }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });

    const res = await fetch('http://localhost:5000/api/admin/va', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error(err);
  }
}
run();
