import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/settings
router.get('/', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.session.userId);
  if (!settings) {
    // Create default settings if missing
    db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(req.session.userId);
    return res.json({ user_id: req.session.userId, theme: 'light', two_factor: 1, notify_resources: 1, notify_mentions: 1, notify_updates: 0 });
  }
  res.json(settings);
});

// PUT /api/settings
router.put('/', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const { theme, two_factor, notify_resources, notify_mentions, notify_updates } = req.body;

  db.prepare(`
    INSERT INTO user_settings (user_id, theme, two_factor, notify_resources, notify_mentions, notify_updates)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      theme = excluded.theme,
      two_factor = excluded.two_factor,
      notify_resources = excluded.notify_resources,
      notify_mentions = excluded.notify_mentions,
      notify_updates = excluded.notify_updates
  `).run(
    req.session.userId,
    theme ?? 'light',
    two_factor ?? 1,
    notify_resources ?? 1,
    notify_mentions ?? 1,
    notify_updates ?? 0
  );

  const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.session.userId);
  res.json(settings);
});

export default router;
