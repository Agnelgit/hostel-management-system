import fs from 'fs/promises';
import path from 'path';
import db from '../server/config/database.js';

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {
    // ignore
  }
}

async function generate() {
  const outDir = path.resolve('reports');
  await ensureDir(outDir);

  try {
    const [students] = await db.execute('SELECT * FROM students');
    for (const s of students) {
      const studentId = s.id;
      const [fees] = await db.execute('SELECT * FROM fee_records WHERE student_id = ? ORDER BY due_date DESC', [studentId]);
      const [complaints] = await db.execute('SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC', [studentId]);
      const [visitors] = await db.execute('SELECT * FROM visitors WHERE student_id = ? ORDER BY entry_time DESC', [studentId]);

      const report = {
        student: s,
        fees,
        complaints,
        visitors
      };

      const filename = path.join(outDir, `${s.student_id || s.id}_report.json`);
      await fs.writeFile(filename, JSON.stringify(report, null, 2), 'utf8');
      console.log('Wrote report for', s.student_id || s.id, '->', filename);
    }
    console.log('All reports generated in', outDir);
  } catch (error) {
    console.error('Error generating reports:', error);
    process.exitCode = 1;
  } finally {
    // close pool if available
    if (db && db.end) {
      try { await db.end(); } catch(e){}
    }
  }
}

generate();
