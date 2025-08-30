import express from 'express';
import db from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get fee records
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT f.*, CONCAT(s.first_name, ' ', s.last_name) as student_name, s.student_id
      FROM fee_records f
      JOIN students s ON f.student_id = s.id
    `;
    let params = [];

    // If student, only show their own records
    if (req.user.role === 'student') {
      const [userStudent] = await db.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (userStudent.length > 0) {
        query += ' WHERE f.student_id = ?';
        params.push(userStudent[0].id);
      } else {
        return res.json([]);
      }
    }

    query += ' ORDER BY f.created_at DESC';
    
    const [fees] = await db.execute(query, params);
    res.json(fees);
  } catch (error) {
    console.error('Error fetching fees:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create fee record
router.post('/', authenticateToken, requireRole(['admin', 'warden']), async (req, res) => {
  try {
    const { student_id, amount, fee_type, due_date, remarks } = req.body;

    const [result] = await db.execute(
      'INSERT INTO fee_records (student_id, amount, fee_type, due_date, remarks) VALUES (?, ?, ?, ?, ?)',
      [student_id, amount, fee_type, due_date, remarks]
    );

    res.status(201).json({ message: 'Fee record created successfully', id: result.insertId });
  } catch (error) {
    console.error('Error creating fee record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update fee payment
router.put('/:id/pay', authenticateToken, requireRole(['admin', 'warden']), async (req, res) => {
  try {
    const feeId = req.params.id;
    const { payment_method, remarks } = req.body;

    await db.execute(
      'UPDATE fee_records SET status = "paid", paid_date = CURDATE(), payment_method = ?, remarks = ? WHERE id = ?',
      [payment_method, remarks, feeId]
    );

    res.json({ message: 'Payment recorded successfully' });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get fee summary
router.get('/summary', authenticateToken, requireRole(['admin', 'warden']), async (req, res) => {
  try {
    const [summary] = await db.execute(`
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_collected,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending,
        SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) as total_overdue
      FROM fee_records
    `);

    res.json(summary[0]);
  } catch (error) {
    console.error('Error fetching fee summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;