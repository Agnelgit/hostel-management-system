import express from 'express';
import db from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Dashboard statistics
router.get('/dashboard', authenticateToken, requireRole(['admin', 'warden']), async (req, res) => {
  try {
    const [stats] = await db.execute(`
      SELECT 
        (SELECT COUNT(*) FROM students WHERE status = 'active') as total_students,
        (SELECT COUNT(*) FROM rooms) as total_rooms,
        (SELECT COUNT(*) FROM rooms WHERE status = 'available') as available_rooms,
        (SELECT COUNT(*) FROM complaints WHERE status = 'open') as open_complaints,
        (SELECT COUNT(*) FROM visitors WHERE status = 'entered') as current_visitors,
        (SELECT SUM(amount) FROM fee_records WHERE status = 'pending') as pending_fees
    `);

    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Monthly report
router.get('/monthly', authenticateToken, requireRole(['admin', 'warden']), async (req, res) => {
  try {
    const { month, year } = req.query;
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = `${year}-${month.padStart(2, '0')}-31`;

    const [report] = await db.execute(`
      SELECT 
        'Fee Collection' as category,
        SUM(CASE WHEN f.status = 'paid' AND f.paid_date BETWEEN ? AND ? THEN f.amount ELSE 0 END) as value,
        COUNT(CASE WHEN f.status = 'paid' AND f.paid_date BETWEEN ? AND ? THEN 1 END) as count
      FROM fee_records f
      UNION ALL
      SELECT 
        'New Admissions' as category,
        0 as value,
        COUNT(*) as count
      FROM students s
      WHERE s.admission_date BETWEEN ? AND ?
      UNION ALL
      SELECT 
        'Complaints Resolved' as category,
        0 as value,
        COUNT(*) as count
      FROM complaints c
      WHERE c.status IN ('resolved', 'closed') AND c.resolved_at BETWEEN ? AND ?
    `, [startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate]);

    res.json(report);
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Per-student report (admin/warden or the student themselves)
router.get('/student/:id', authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.id;

    // allow student to fetch only their own report
    if (req.user.role === 'student') {
      const [userStudent] = await db.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
      if (userStudent.length === 0 || userStudent[0].id != studentId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else {
      // admin/warden allowed
    }

    // Gather student profile, fees, complaints, visitors
    const [students] = await db.execute('SELECT * FROM students WHERE id = ?', [studentId]);
    if (students.length === 0) return res.status(404).json({ error: 'Student not found' });
    const student = students[0];

    const [fees] = await db.execute('SELECT * FROM fee_records WHERE student_id = ? ORDER BY due_date DESC', [studentId]);
    const [complaints] = await db.execute('SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC', [studentId]);
    const [visitors] = await db.execute('SELECT * FROM visitors WHERE student_id = ? ORDER BY entry_time DESC', [studentId]);

    res.json({ student, fees, complaints, visitors });
  } catch (error) {
    console.error('Error generating student report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;