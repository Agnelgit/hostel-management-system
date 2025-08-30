import express from 'express';
import db from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all students
router.get('/', authenticateToken, requireRole(['admin', 'warden']), async (req, res) => {
  try {
    const [students] = await db.execute(`
      SELECT s.*, r.room_number, ra.allocation_date
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
      SELECT s.*, r.room_number, ra.allocation_date
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
      SELECT s.*, r.room_number, ra.allocation_date
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

    res.status(201).json({ message: 'Student created successfully', id: result.insertId });
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