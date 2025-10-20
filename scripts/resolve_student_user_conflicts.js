import bcrypt from 'bcryptjs';
import db from '../server/config/database.js';

async function resolve() {
  try {
    const [students] = await db.execute('SELECT id, user_id, student_id, first_name, last_name, email FROM students');
    const conflicts = [];

    for (const s of students) {
      const fullName = `${s.first_name} ${s.last_name}`.trim();
      const plainPassword = String(s.student_id || '').trim();
      const hashed = plainPassword ? await bcrypt.hash(plainPassword, 10) : null;

      if (s.user_id) {
        // ensure user exists and update
        const [u] = await db.execute('SELECT id FROM users WHERE id = ? LIMIT 1', [s.user_id]);
        if (u.length === 0) {
          // linked user missing — create one
          const [uRes] = await db.execute('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [fullName, s.email, hashed, 'student']);
          const newUserId = uRes.insertId;
          await db.execute('UPDATE students SET user_id = ? WHERE id = ?', [newUserId, s.id]);
          console.log(`Recreated missing user ${newUserId} for student ${s.id}`);
        } else {
          // update existing user
          // but avoid setting email to a value already owned by another user (would cause ER_DUP_ENTRY)
          const [emailOwner] = await db.execute('SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ? LIMIT 1', [s.email, s.user_id]);
          let emailToSet = s.email;
          if (emailOwner.length > 0) {
            // email already in use by another user -> create a unique email using +student_id
            const at = (s.email || '').indexOf('@');
            if (at > 0) {
              emailToSet = `${s.email.substring(0, at)}+${s.student_id}@${s.email.substring(at + 1)}`;
            } else {
              emailToSet = `${s.email}+${s.student_id}`;
            }
            console.warn(`Email ${s.email} already used by user ${emailOwner[0].id}; setting user ${s.user_id} email to unique ${emailToSet}`);
          }

          if (hashed) {
            await db.execute('UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?', [fullName, emailToSet, hashed, s.user_id]);
          } else {
            await db.execute('UPDATE users SET username = ?, email = ? WHERE id = ?', [fullName, emailToSet, s.user_id]);
          }
        }
      } else {
        // no linked user — find by email
        const [existing] = await db.execute('SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [s.email]);
        if (existing.length > 0) {
          const existingId = existing[0].id;
          const [linked] = await db.execute('SELECT id FROM students WHERE user_id = ? LIMIT 1', [existingId]);
          if (linked.length === 0) {
            await db.execute('UPDATE users SET username = ?, password = ? WHERE id = ?', [fullName, hashed, existingId]);
            await db.execute('UPDATE students SET user_id = ? WHERE id = ?', [existingId, s.id]);
            console.log(`Linked existing user ${existingId} to student ${s.id}`);
          } else {
            // create unique user
            const at = (s.email || '').indexOf('@');
            let uniqueEmail = s.email;
            if (at > 0) {
              uniqueEmail = `${s.email.substring(0, at)}+${s.student_id}@${s.email.substring(at + 1)}`;
            } else {
              uniqueEmail = `${s.email}+${s.student_id}`;
            }
            const [uRes] = await db.execute('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [fullName, uniqueEmail, hashed, 'student']);
            const newUserId = uRes.insertId;
            await db.execute('UPDATE students SET user_id = ? WHERE id = ?', [newUserId, s.id]);
            console.log(`Created user ${newUserId} (${uniqueEmail}) for student ${s.id}`);
            conflicts.push({ studentId: s.id, reason: 'email-in-use', existingUserId: existingId, newUserId, uniqueEmail });
          }
        } else {
          // create new user and link
          const [uRes] = await db.execute('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [fullName, s.email, hashed, 'student']);
          const newUserId = uRes.insertId;
          await db.execute('UPDATE students SET user_id = ? WHERE id = ?', [newUserId, s.id]);
          console.log(`Created user ${newUserId} for student ${s.id}`);
        }
      }
    }

    if (conflicts.length > 0) {
      console.log('\nConflicts encountered (created unique users for students whose emails were in use):');
      console.table(conflicts);
    } else {
      console.log('\nNo conflicts encountered. All students have users.');
    }
  } catch (error) {
    console.error('Error resolving student-user conflicts:', error);
    process.exitCode = 1;
  } finally {
    if (db && db.end) {
      try { await db.end(); } catch(e){}
    }
  }
}

resolve();
