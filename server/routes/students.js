import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all students
router.get('/', authenticateToken, requireRole(['admin', 'warden']), async (req, res) => {
  try {
    const [students] = await db.execute(`
      SELECT s.*, r.room_number, ra.allocation_date,
        IFNULL((SELECT SUM(amount) FROM fee_records f WHERE f.student_id = s.id AND f.status = 'pending'), 0) as pending_fees_total,
        (SELECT COUNT(*) FROM complaints c WHERE c.student_id = s.id AND c.status IN ('open', 'in_progress')) as active_complaints_count,
        (SELECT COUNT(*) FROM visitors v WHERE v.student_id = s.id AND v.status = 'entered') as active_visitors_count
      FROM students s
      LEFT JOIN room_allocations ra ON s.id = ra.student_id AND ra.status = 'active'
      LEFT JOIN rooms r ON ra.room_id = r.id
      ORDER BY s.created_at DESC
    `);
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student by user ID
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Check if user can access this data
    if (req.user.role === 'student' && req.user.id != userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [students] = await db.execute(`
      SELECT s.*, r.room_number, ra.allocation_date,
        IFNULL((SELECT SUM(amount) FROM fee_records f WHERE f.student_id = s.id AND f.status = 'pending'), 0) as pending_fees_total,
        (SELECT COUNT(*) FROM complaints c WHERE c.student_id = s.id AND c.status IN ('open', 'in_progress')) as active_complaints_count,
        (SELECT COUNT(*) FROM visitors v WHERE v.student_id = s.id AND v.status = 'entered') as active_visitors_count
      FROM students s
      LEFT JOIN room_allocations ra ON s.id = ra.student_id AND ra.status = 'active'
      LEFT JOIN rooms r ON ra.room_id = r.id
      WHERE s.user_id = ?
    `, [userId]);

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(students[0]);
  } catch (error) {
    console.error('Error fetching student by user ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.id;
    
    // Check if user can access this student's data
    if (req.user.role === 'student') {
      const [userStudent] = await db.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (userStudent.length === 0 || userStudent[0].id != studentId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const [students] = await db.execute(`
      SELECT s.*, r.room_number, ra.allocation_date,
        IFNULL((SELECT SUM(amount) FROM fee_records f WHERE f.student_id = s.id AND f.status = 'pending'), 0) as pending_fees_total,
        (SELECT COUNT(*) FROM complaints c WHERE c.student_id = s.id AND c.status IN ('open', 'in_progress')) as active_complaints_count,
        (SELECT COUNT(*) FROM visitors v WHERE v.student_id = s.id AND v.status = 'entered') as active_visitors_count
      FROM students s
      LEFT JOIN room_allocations ra ON s.id = ra.student_id AND ra.status = 'active'
      LEFT JOIN rooms r ON ra.room_id = r.id
      WHERE s.id = ?
    `, [studentId]);

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(students[0]);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new student
router.post('/', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const {
      student_id, first_name, last_name, email, phone, address, course,
      year_of_study, guardian_name, guardian_phone, admission_date
    } = req.body;

    const [result] = await db.execute(`
      INSERT INTO students (student_id, first_name, last_name, email, phone, address, course, year_of_study, guardian_name, guardian_phone, admission_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [student_id, first_name, last_name, email, phone, address, course, year_of_study, guardian_name, guardian_phone, admission_date]);

    const newStudentId = result.insertId;

    // After creating a student, ensure a corresponding users row exists and is linked.
    try {
      const fullName = `${first_name} ${last_name}`.trim();
      const plainPassword = String(student_id || '').trim();
      if (plainPassword) {
        const hashed = await bcrypt.hash(plainPassword, 10);

        // Try to find an existing user by email (case-insensitive)
        const [existing] = await db.execute('SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [email]);
        if (existing.length > 0) {
          const existingId = existing[0].id;
          // Update user credentials
          await db.execute('UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?', [fullName, email, hashed, existingId]);
          // Only link if that user isn't linked to another student
          const [linked] = await db.execute('SELECT id FROM students WHERE user_id = ? LIMIT 1', [existingId]);
          if (linked.length === 0) {
            await db.execute('UPDATE students SET user_id = ? WHERE id = ?', [existingId, newStudentId]);
            console.log(`Linked existing user ${existingId} to new student ${newStudentId}`);
          } else if (linked[0].id === newStudentId) {
            // already linked
          } else {
            // existing user is linked to another student -> create a unique user for this student
            const at = (email || '').indexOf('@');
            let uniqueEmail = email;
            if (at > 0) {
              uniqueEmail = `${email.substring(0, at)}+${student_id}@${email.substring(at + 1)}`;
            } else {
              uniqueEmail = `${email}+${student_id}`;
            }
            const [uRes] = await db.execute('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [fullName, uniqueEmail, hashed, 'student']);
            const newUserId = uRes.insertId;
            await db.execute('UPDATE students SET user_id = ? WHERE id = ?', [newUserId, newStudentId]);
            console.log(`Existing user ${existingId} linked to student ${linked[0].id}; created new user ${newUserId} (${uniqueEmail}) for student ${newStudentId}`);
          }
        } else {
          // Insert new user and link
          const [uRes] = await db.execute('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [fullName, email, hashed, 'student']);
          const newUserId = uRes.insertId;
          await db.execute('UPDATE students SET user_id = ? WHERE id = ?', [newUserId, newStudentId]);
          console.log(`Created user ${newUserId} for new student ${newStudentId}`);
        }
      }
    } catch (err) {
      console.error('Error while creating/linking user for new student:', err);
      // don't fail the student creation if user linking fails; return info
    }

    res.status(201).json({ message: 'Student created successfully', id: newStudentId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Student ID already exists' });
    } else {
      console.error('Error creating student:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update student
router.put('/:id', authenticateToken, requireRole(['admin', 'warden']), async (req, res) => {
  try {
    const studentId = req.params.id;
    const updateFields = req.body;
    
    const setClause = Object.keys(updateFields).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateFields), studentId];

    await db.execute(`UPDATE students SET ${setClause} WHERE id = ?`, values);
    // After update, sync the users table for this student
    try {
      const [rows] = await db.execute('SELECT id, user_id, student_id, first_name, last_name, email FROM students WHERE id = ? LIMIT 1', [studentId]);
      if (rows.length > 0) {
        const s = rows[0];
        const fullName = `${s.first_name} ${s.last_name}`.trim();
        const plainPassword = String(s.student_id || '').trim();
        const hashed = plainPassword ? await bcrypt.hash(plainPassword, 10) : null;

        if (s.user_id) {
          // update linked user
          if (hashed) {
            await db.execute('UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?', [fullName, s.email, hashed, s.user_id]);
          } else {
            await db.execute('UPDATE users SET username = ?, email = ? WHERE id = ?', [fullName, s.email, s.user_id]);
          }
        } else {
          // try to find a user by email to link
          const [existing] = await db.execute('SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1', [s.email]);
          if (existing.length > 0) {
            const existingId = existing[0].id;
            // update credentials
            if (hashed) {
              await db.execute('UPDATE users SET username = ?, password = ? WHERE id = ?', [fullName, hashed, existingId]);
            } else {
              await db.execute('UPDATE users SET username = ? WHERE id = ?', [fullName, existingId]);
            }
            // link if safe, otherwise create a unique user for this student
            const [linked] = await db.execute('SELECT id FROM students WHERE user_id = ? LIMIT 1', [existingId]);
            if (linked.length === 0) {
              await db.execute('UPDATE students SET user_id = ? WHERE id = ?', [existingId, s.id]);
            } else if (linked[0].id !== s.id) {
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
              console.log(`Existing user ${existingId} linked to student ${linked[0].id}; created new user ${newUserId} (${uniqueEmail}) for student ${s.id}`);
            }
          } else if (hashed) {
            // create user and link
            const [uRes] = await db.execute('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [fullName, s.email, hashed, 'student']);
            const newUserId = uRes.insertId;
            await db.execute('UPDATE students SET user_id = ? WHERE id = ?', [newUserId, s.id]);
          }
        }
      }
    } catch (err) {
      console.error('Error syncing user after student update:', err);
    }

    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete student
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const studentId = req.params.id;
    await db.execute('DELETE FROM students WHERE id = ?', [studentId]);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student fees
router.get('/:id/fees', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.id;
    
    // Check if user can access this student's data
    if (req.user.role === 'student') {
      const [userStudent] = await db.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (userStudent.length === 0 || userStudent[0].id != studentId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const [fees] = await db.execute(`
      SELECT * FROM fee_records 
      WHERE student_id = ? 
      ORDER BY due_date DESC
    `, [studentId]);

    res.json(fees);
  } catch (error) {
    console.error('Error fetching student fees:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student complaints
router.get('/:id/complaints', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.id;
    
    // Check if user can access this student's data
    if (req.user.role === 'student') {
      const [userStudent] = await db.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (userStudent.length === 0 || userStudent[0].id != studentId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const [complaints] = await db.execute(`
      SELECT * FROM complaints 
      WHERE student_id = ? 
      ORDER BY created_at DESC
    `, [studentId]);

    res.json(complaints);
  } catch (error) {
    console.error('Error fetching student complaints:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student visitors
router.get('/:id/visitors', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.id;
    
    // Check if user can access this student's data
    if (req.user.role === 'student') {
      const [userStudent] = await db.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (userStudent.length === 0 || userStudent[0].id != studentId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const [visitors] = await db.execute(`
      SELECT * FROM visitors 
      WHERE student_id = ? 
      ORDER BY entry_time DESC
    `, [studentId]);

    res.json(visitors);
  } catch (error) {
    console.error('Error fetching student visitors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;