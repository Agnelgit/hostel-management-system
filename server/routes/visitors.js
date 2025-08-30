import express from 'express';
import db from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get visitors
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT v.*, CONCAT(s.first_name, ' ', s.last_name) as student_name, s.student_id
      FROM visitors v
      JOIN students s ON v.student_id = s.id
    `;
    let params = [];

    // If student, only show their own visitors
    if (req.user.role === 'student') {
      const [userStudent] = await db.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (userStudent.length > 0) {
        query += ' WHERE v.student_id = ?';
        params.push(userStudent[0].id);
      } else {
        return res.json([]);
      }
    }

    query += ' ORDER BY v.entry_time DESC';
    
    const [visitors] = await db.execute(query, params);
    res.json(visitors);
  } catch (error) {
    console.error('Error fetching visitors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register visitor entry
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { student_id, visitor_name, visitor_phone, purpose, id_type, id_number, entry_time } = req.body;
    let actual_student_id = student_id;
    let actual_entry_time = entry_time || new Date();

    // If student is registering their own visitor
    if (req.user.role === 'student') {
      const [userStudent] = await db.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (userStudent.length === 0) {
        return res.status(400).json({ error: 'Student record not found' });
      }
      actual_student_id = userStudent[0].id;
    }

    const [result] = await db.execute(
      'INSERT INTO visitors (student_id, visitor_name, visitor_phone, purpose, entry_time, id_type, id_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [actual_student_id, visitor_name, visitor_phone, purpose, actual_entry_time, id_type, id_number]
    );

    res.status(201).json({ message: 'Visitor entry registered successfully', id: result.insertId });
  } catch (error) {
    console.error('Error registering visitor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register visitor exit
router.put('/:id/exit', authenticateToken, async (req, res) => {
  try {
    const visitorId = req.params.id;
    const exit_time = new Date();

    // Check if user can access this visitor record
    if (req.user.role === 'student') {
      const [userStudent] = await db.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (userStudent.length === 0) {
        return res.status(400).json({ error: 'Student record not found' });
      }
      
      // Verify the visitor belongs to this student
      const [visitor] = await db.execute('SELECT student_id FROM visitors WHERE id = ?', [visitorId]);
      if (visitor.length === 0 || visitor[0].student_id !== userStudent[0].id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    await db.execute(
      'UPDATE visitors SET exit_time = ?, status = "exited" WHERE id = ?',
      [exit_time, visitorId]
    );

    res.json({ message: 'Visitor exit registered successfully' });
  } catch (error) {
    console.error('Error registering visitor exit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;