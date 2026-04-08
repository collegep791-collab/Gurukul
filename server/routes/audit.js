import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/audit — admin-only audit log
router.get('/', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.userId);
  if (user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = parseInt(req.query.offset) || 0;

  const logs = db.prepare(`
    SELECT al.*, u.name as actor_name, u.avatar as actor_avatar
    FROM audit_log al
    LEFT JOIN users u ON al.actor_id = u.id
    ORDER BY al.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  res.json(logs);
});

export default router;
