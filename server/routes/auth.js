import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Try to find the user by username or email first (case-insensitive email)
    let [users] = await db.execute(
      'SELECT id, username, email, password, role FROM users WHERE username = ? OR LOWER(email) = LOWER(?) LIMIT 1',
      [username, username]
    );

    let user = null;
    let studentRecord = null;

    if (users.length > 0) {
      user = users[0];
      // try to load student record for fallback (if any)
      try {
        const [srows] = await db.execute('SELECT id, student_id, first_name, last_name FROM students WHERE user_id = ? LIMIT 1', [user.id]);
        if (srows.length > 0) studentRecord = srows[0];
      } catch (e) {
        console.error('Error loading student record for fallback:', e);
      }
    } else {
      // Not a users match — try to find by student full name or student email and load linked user
      try {
        const [rows] = await db.execute(
          `SELECT u.id as user_id, u.username as username, u.email as email, u.password as password, u.role as role,
                  s.id as student_pk, s.student_id as student_id_value, s.first_name as first_name, s.last_name as last_name
           FROM students s JOIN users u ON s.user_id = u.id
           WHERE LOWER(CONCAT(TRIM(s.first_name), ' ', TRIM(s.last_name))) = LOWER(TRIM(?))
             OR LOWER(s.email) = LOWER(TRIM(?)) LIMIT 1`,
          [username, username]
        );

        if (rows.length > 0) {
          const r = rows[0];
          user = {
            id: r.user_id,
            username: r.username,
            email: r.email,
            password: r.password,
            role: r.role
          };
          studentRecord = {
            id: r.student_pk,
            student_id: r.student_id_value,
            first_name: r.first_name,
            last_name: r.last_name
          };
        }
      } catch (e) {
        console.error('Error searching student by name during login:', e);
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password with bcrypt first
    let validPassword = false;
    try {
      validPassword = await bcrypt.compare(password, user.password);
    } catch (e) {
      validPassword = false;
    }

    // If bcrypt fails and this account maps to a student, allow student_id as fallback password (case-insensitive match trimmed)
    if (!validPassword) {
      try {
        let studentIdFromRow = null;
        if (studentRecord && studentRecord.student_id) studentIdFromRow = studentRecord.student_id;
        if (!studentIdFromRow) {
          const [studentRows] = await db.execute('SELECT student_id FROM students WHERE user_id = ? LIMIT 1', [user.id]);
          if (studentRows.length > 0) studentIdFromRow = studentRows[0].student_id;
        }

        if (user.role === 'student' && studentIdFromRow) {
          if (String(password).trim() === String(studentIdFromRow).trim()) {
            validPassword = true;
          }
        }
      } catch (e) {
        console.error('Error checking student id for login fallback:', e);
      }
    }

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '24h' });

    // If login was via student name, prefer returning the student's full name as username for frontend display
    let returnUsername = user.username;
    if (studentRecord && studentRecord.first_name && studentRecord.last_name) {
      returnUsername = `${studentRecord.first_name} ${studentRecord.last_name}`;
    }

    res.json({
      token,
      user: {
        id: user.id,
        username: returnUsername,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role = 'student' } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, role]
    );

    res.status(201).json({ message: 'User registered successfully', id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Username or email already exists' });
    } else {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;