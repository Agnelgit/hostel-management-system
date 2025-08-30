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

export default router;