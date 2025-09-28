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

    // Try to find the user by username or email first
    let [users] = await db.execute(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    // If not found, try to match by student's full name (first + last) or student email
    if (users.length === 0) {
      try {
        const [students] = await db.execute(
          `SELECT s.*, u.* FROM students s JOIN users u ON s.user_id = u.id WHERE CONCAT(s.first_name, ' ', s.last_name) = ? OR s.email = ?`,
          [username, username]
        );

        if (students.length > 0) {
          // students rows will include user fields (u.*) — pick the first
          users = [students[0]];
        }
      } catch (e) {
        console.error('Error searching student by name during login:', e);
      }
    }

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // For student accounts allow login with their student_id as password
    let validPassword = false;
    try {
      validPassword = await bcrypt.compare(password, user.password);
    } catch (e) {
      validPassword = false;
    }

    if (!validPassword && user.role === 'student') {
      try {
        const [studentRows] = await db.execute('SELECT student_id FROM students WHERE user_id = ?', [user.id]);
        if (studentRows.length > 0) {
          const studentRecord = studentRows[0];
          if (password === studentRecord.student_id) {
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

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
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