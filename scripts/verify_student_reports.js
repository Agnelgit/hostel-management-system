import db from '../server/config/database.js';

async function verify() {
  try {
    const [students] = await db.execute(`
      SELECT s.id, s.student_id, s.first_name, s.last_name, s.email,
        IFNULL((SELECT SUM(amount) FROM fee_records f WHERE f.student_id = s.id AND f.status = 'pending'), 0) as pending_fees_total,
        (SELECT COUNT(*) FROM complaints c WHERE c.student_id = s.id AND c.status IN ('open', 'in_progress')) as active_complaints_count,
        (SELECT COUNT(*) FROM visitors v WHERE v.student_id = s.id AND v.status = 'entered') as active_visitors_count
      FROM students s
      ORDER BY s.id
    `);

    console.table(students.map(s => ({
      id: s.id,
      student_id: s.student_id,
      name: `${s.first_name} ${s.last_name}`,
      email: s.email,
      pending_fees_total: s.pending_fees_total,
      active_complaints_count: s.active_complaints_count,
      active_visitors_count: s.active_visitors_count,
    })));
  } catch (err) {
    console.error('Verification failed:', err);
  } finally {
    if (db && db.end) try { await db.end(); } catch(e){}
  }
}

verify();
