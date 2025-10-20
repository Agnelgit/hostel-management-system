import bcrypt from 'bcryptjs';
import db from '../server/config/database.js';

async function sync() {
  try {
    // Get all students
    const [students] = await db.execute('SELECT id, user_id, student_id, first_name, last_name, email FROM students');
    if (students.length === 0) {
      console.log('No students found.');
      return;
    }

    for (const s of students) {
      const fullName = `${s.first_name} ${s.last_name}`.trim();
      const plainPassword = String(s.student_id || '').trim();
      if (!plainPassword) {
        console.warn('Skipping student without student_id:', s.id);
        continue;
      }

      const hashed = await bcrypt.hash(plainPassword, 10);

      if (s.user_id) {
        // update existing user
        await db.execute('UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?', [fullName, s.email, hashed, s.user_id]);
        console.log(`Updated user ${s.user_id}: set username='${fullName}', password=bcrypt(student_id)`);
      } else {
        // try to find an existing user by email to avoid duplicate entry
        const [existing] = await db.execute('SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [s.email]);
        if (existing.length > 0) {
          const existingId = existing[0].id;
          // update that user
          await db.execute('UPDATE users SET username = ?, password = ? WHERE id = ?', [fullName, hashed, existingId]);
          // check if this user_id is already linked to a student
          const [linked] = await db.execute('SELECT id FROM students WHERE user_id = ? LIMIT 1', [existingId]);
          if (linked.length === 0) {
            // safe to link
            await db.execute('UPDATE students SET user_id = ? WHERE id = ?', [existingId, s.id]);
            console.log(`Linked existing user ${existingId} to student ${s.id} and updated credentials`);
          } else if (linked[0].id === s.id) {
            // already linked to this student (shouldn't happen because s.user_id was null), but handle
            console.log(`Existing user ${existingId} already linked to student ${s.id}, updated credentials`);
          } else {
            // linked to another student — do not overwrite; just update credentials
            console.warn(`Existing user ${existingId} is already linked to student ${linked[0].id}; not linking to student ${s.id}. Credentials updated.`);
          }
        } else {
          // create new user and link to student
          const [result] = await db.execute('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [fullName, s.email, hashed, 'student']);
          const newUserId = result.insertId;
          await db.execute('UPDATE students SET user_id = ? WHERE id = ?', [newUserId, s.id]);
          console.log(`Created user ${newUserId} for student ${s.id} and linked user_id`);
        }
      }
    }

    console.log('Student → user sync complete for all students.');
  } catch (error) {
    console.error('Error syncing students to users:', error);
    process.exitCode = 1;
  } finally {
    if (db && db.end) {
      try { await db.end(); } catch(e){}
    }
  }
}

sync();
