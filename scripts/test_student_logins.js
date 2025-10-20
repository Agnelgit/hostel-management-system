import fetch from 'node-fetch';
import db from '../server/config/database.js';

const API_LOGIN = 'http://localhost:3001/api/auth/login';

async function testLogins() {
  try {
    const [students] = await db.execute('SELECT * FROM students');
    for (const s of students) {
      const fullName = `${s.first_name} ${s.last_name}`;
      const payloads = [
        { username: fullName, password: s.student_id },
        { username: s.email, password: s.student_id }
      ];

      for (const p of payloads) {
        try {
          const res = await fetch(API_LOGIN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p)
          });
          const body = await res.json();
          console.log(s.student_id, '-', p.username, '-', res.status, body.error ? body.error : 'OK');
        } catch (e) {
          console.error('Network error testing', p, e.message);
        }
      }
    }
  } catch (error) {
    console.error('Error querying students:', error);
  } finally {
    if (db && db.end) {
      try { await db.end(); } catch(e){}
    }
  }
}

testLogins();
