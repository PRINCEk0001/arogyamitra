import express from 'express';
import db from '../database/database.js';

const router = express.Router();

// Get progress history for a user
router.get('/:userId', (req, res) => {
  const { userId } = req.params;

  try {
    const progress = db.prepare('SELECT * FROM progress WHERE user_id = ? ORDER BY date ASC').all(userId);
    res.json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress data' });
  }
});

// Add new progress entry
router.post('/', (req: any, res) => {
  const userId = req.user.userId;
  const { weight, bmi, workout_completed, notes } = req.body;

  if (!weight) {
    return res.status(400).json({ error: 'Weight is required' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO progress (user_id, weight, bmi, workout_completed, notes)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(userId, weight, bmi, workout_completed ? 1 : 0, notes);
    res.status(201).json({ message: 'Progress recorded successfully' });
  } catch (error) {
    console.error('Error recording progress:', error);
    res.status(500).json({ error: 'Failed to record progress' });
  }
});

export default router;
