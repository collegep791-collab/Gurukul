import { Router } from 'express';
import db from '../db.js';

const router = Router();

// Ensure user is authenticated
router.use((req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  next();
});

// GET /api/streaks/me
router.get('/me', (req, res) => {
  const userId = req.session.userId;
  
  const user = db.prepare('SELECT streak, credits FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  // Get today's activity
  const todayDateObj = new Date();
  const todayStr = todayDateObj.toISOString().split('T')[0];
  
  const todayActivity = db.prepare(`
    SELECT COUNT(*) as count FROM user_activity 
    WHERE user_id = ? AND date(created_at) = ? AND activity_type = 'login'
  `).get(userId, todayStr);
  
  // Get last 7 days of activity summary
  const last7Days = db.prepare(`
    SELECT date(created_at) as log_date, SUM(credits_earned) as total_credits 
    FROM user_activity 
    WHERE user_id = ? AND created_at >= datetime('now', '-7 days')
    GROUP BY log_date
    ORDER BY log_date ASC
  `).all(userId);

  res.json({
    streak: user.streak,
    credits: user.credits,
    checkedInToday: todayActivity.count > 0,
    history: last7Days
  });
});

// POST /api/streaks/checkin
router.post('/checkin', (req, res) => {
  const userId = req.session.userId;
  
  const user = db.prepare('SELECT streak, credits FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const todayStr = new Date().toISOString().split('T')[0];
  
  // Did they check in today?
  const todayActivity = db.prepare(`
    SELECT id FROM user_activity 
    WHERE user_id = ? AND date(created_at) = ? AND activity_type = 'login'
  `).get(userId, todayStr);

  if (todayActivity) {
    return res.json({ message: 'Already checked in today', streak: user.streak, credits: user.credits });
  }

  // Did they check in yesterday? If so, continuous streak.
  const yesterdayDateObj = new Date();
  yesterdayDateObj.setDate(yesterdayDateObj.getDate() - 1);
  const yesterdayStr = yesterdayDateObj.toISOString().split('T')[0];

  const yesterdayActivity = db.prepare(`
    SELECT id FROM user_activity 
    WHERE user_id = ? AND date(created_at) = ? AND activity_type = 'login'
  `).get(userId, yesterdayStr);

  let newStreak = user.streak;
  if (yesterdayActivity) {
    newStreak += 1; // Unbroken streak
  } else {
    newStreak = 1; // Reset streak
  }

  const baseCredits = 10;
  const bonus = newStreak * 5;
  const earned = baseCredits + bonus;
  const newCredits = user.credits + earned;

  // Transaction to update streak, credits, and log
  const runCheckin = db.transaction(() => {
    db.prepare('UPDATE users SET streak = ?, credits = ? WHERE id = ?').run(newStreak, newCredits, userId);
    db.prepare('INSERT INTO user_activity (user_id, activity_type, credits_earned) VALUES (?, ?, ?)')
      .run(userId, 'login', earned);
  });
  
  runCheckin();

  res.json({ streak: newStreak, credits: newCredits, earned });
});

export default router;
