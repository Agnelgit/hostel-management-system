import db from '../server/config/database.js';

async function printUsers() {
  try {
    const [rows] = await db.execute('SELECT id, username, email, role, created_at FROM users');
    console.table(rows.map(r => ({ id: r.id, username: r.username, email: r.email, role: r.role, created_at: r.created_at })));
  } catch (err) {
    console.error('Error querying users:', err);
  } finally {
    if (db && db.end) {
      try { await db.end(); } catch(e){}
    }
  }
}

printUsers();
