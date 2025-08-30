import express from 'express';
import db from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all rooms
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rooms] = await db.execute(`
      SELECT r.*, 
             COUNT(ra.id) as current_occupancy,
             GROUP_CONCAT(CONCAT(s.first_name, ' ', s.last_name) SEPARATOR ', ') as occupants
      FROM rooms r
      LEFT JOIN room_allocations ra ON r.id = ra.room_id AND ra.status = 'active'
      LEFT JOIN students s ON ra.student_id = s.id
      GROUP BY r.id
      ORDER BY r.room_number
    `);
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Allocate room to student
router.post('/allocate', authenticateToken, requireRole(['admin', 'warden']), async (req, res) => {
  try {
    const { student_id, room_id, allocation_date } = req.body;

    // Check if room is available
    const [rooms] = await db.execute(`
      SELECT r.capacity, COUNT(ra.id) as current_occupancy
      FROM rooms r
      LEFT JOIN room_allocations ra ON r.id = ra.room_id AND ra.status = 'active'
      WHERE r.id = ?
      GROUP BY r.id
    `, [room_id]);

    if (rooms.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const room = rooms[0];
    if (room.current_occupancy >= room.capacity) {
      return res.status(400).json({ error: 'Room is already at full capacity' });
    }

    // Check if student already has an active allocation
    const [existing] = await db.execute(
      'SELECT id FROM room_allocations WHERE student_id = ? AND status = "active"',
      [student_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Student already has an active room allocation' });
    }

    // Create allocation
    await db.execute(
      'INSERT INTO room_allocations (student_id, room_id, allocation_date) VALUES (?, ?, ?)',
      [student_id, room_id, allocation_date]
    );

    // Update room status if needed
    if (room.current_occupancy + 1 === room.capacity) {
      await db.execute('UPDATE rooms SET status = "occupied" WHERE id = ?', [room_id]);
    }

    res.json({ message: 'Room allocated successfully' });
  } catch (error) {
    console.error('Error allocating room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Deallocate room
router.post('/deallocate/:allocation_id', authenticateToken, requireRole(['admin', 'warden']), async (req, res) => {
  try {
    const allocationId = req.params.allocation_id;

    await db.execute(
      'UPDATE room_allocations SET status = "ended", end_date = CURDATE() WHERE id = ?',
      [allocationId]
    );

    res.json({ message: 'Room deallocated successfully' });
  } catch (error) {
    console.error('Error deallocating room:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;