import express from 'express';
import db from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get complaints
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT c.*, CONCAT(s.first_name, ' ', s.last_name) as student_name, s.student_id,
             u.username as assigned_to_name
      FROM complaints c
      JOIN students s ON c.student_id = s.id
      LEFT JOIN users u ON c.assigned_to = u.id
    `;
    let params = [];

    // If student, only show their own complaints
    if (req.user.role === 'student') {
      const [userStudent] = await db.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (userStudent.length > 0) {
        query += ' WHERE c.student_id = ?';
        params.push(userStudent[0].id);
      } else {
        return res.json([]);
      }
    }

    query += ' ORDER BY c.created_at DESC';
    
    const [complaints] = await db.execute(query, params);
    res.json(complaints);
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create complaint
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;
    let student_id;

    if (req.user.role === 'student') {
      const [userStudent] = await db.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (userStudent.length === 0) {
        return res.status(400).json({ error: 'Student record not found' });
      }
      student_id = userStudent[0].id;
    } else {
      student_id = req.body.student_id;
    }

    const [result] = await db.execute(
      'INSERT INTO complaints (student_id, title, description, category, priority) VALUES (?, ?, ?, ?, ?)',
      [student_id, title, description, category, priority]
    );

    res.status(201).json({ message: 'Complaint submitted successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update complaint status
router.put('/:id', authenticateToken, requireRole(['admin', 'warden']), async (req, res) => {
  try {
    const complaintId = req.params.id;
    const { status, assigned_to, resolution_notes } = req.body;

    let query = 'UPDATE complaints SET status = ?';
    let params = [status];

    if (assigned_to !== undefined) {
      query += ', assigned_to = ?';
      params.push(assigned_to);
    }

    if (resolution_notes) {
      query += ', resolution_notes = ?';
      params.push(resolution_notes);
    }

    if (status === 'resolved' || status === 'closed') {
      query += ', resolved_at = NOW()';
    }

    query += ' WHERE id = ?';
    params.push(complaintId);

    await db.execute(query, params);
    res.json({ message: 'Complaint updated successfully' });
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;