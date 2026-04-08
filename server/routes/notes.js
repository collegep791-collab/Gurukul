import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/notes
router.get('/', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  // Get notes created by the current user, OR notes created by teachers/admins (which act as course material)
  const notes = db.prepare(`
    SELECT n.*, u.name as author_name, u.role as author_role 
    FROM notes n
    JOIN users u ON n.user_id = u.id
    WHERE n.user_id = ? OR u.role IN ('TEACHER', 'ADMIN')
    ORDER BY n.updated_at DESC
  `).all(req.session.userId);

  res.json(notes);
});

// GET /api/notes/:id
router.get('/:id', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const note = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(req.params.id, req.session.userId);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json(note);
});

// POST /api/notes
router.post('/', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const { title, content, category } = req.body;
  const result = db.prepare(`
    INSERT INTO notes (user_id, title, content, category) VALUES (?, ?, ?, ?)
  `).run(req.session.userId, title || 'Untitled', content || '', category || 'General');

  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(note);
});

// PUT /api/notes/:id
router.put('/:id', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const { title, content, category } = req.body;
  db.prepare(`
    UPDATE notes SET title = ?, content = ?, category = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(title, content, category || 'General', req.params.id, req.session.userId);

  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
  res.json(note);
});

// DELETE /api/notes/:id
router.delete('/:id', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').run(req.params.id, req.session.userId);
  res.json({ ok: true });
});

export default router;
