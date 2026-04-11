import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../db.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Multer Config for Avatars ───
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', '..', 'uploads', 'avatars');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.session.userId}-${Date.now()}${ext}`);
  }
});
const uploadAvatar = multer({ 
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// Helper for safe user select
const SAFE_USER_COLS = 'id, name, email, avatar, role, status, credits, streak, progress, usn, class, section, date_joined';

// POST /api/users — Admin creates a new user manually
router.post('/', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const caller = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.userId);
  if (caller?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

  const { name, email, password, role, usn, class: className, section } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'Required: name, email, password, role' });

  const hash = bcrypt.hashSync(password, 10);
  
  try {
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, usn, class, section) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name.trim(), email.trim().toLowerCase(), hash, role.toUpperCase(), (usn || '').toUpperCase(), className || '', section || '');

    const newUser = db.prepare(`SELECT ${SAFE_USER_COLS} FROM users WHERE id = ?`).get(result.lastInsertRowid);
    
    if (req.app.locals.auditLog) {
      req.app.locals.auditLog(req.session.userId, 'admin_user_create', 'user', newUser.id, `Created ${role}: ${name}`);
    }

    res.status(201).json(newUser);
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Email or USN already exists' });
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PATCH /api/users/me — update own profile
router.patch('/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const { name, email, usn, class: className, section } = req.body;
  if (!name && !email && !usn && !className && !section) return res.status(400).json({ error: 'Nothing to update' });

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });
    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.trim().toLowerCase(), req.session.userId);
    if (existing) return res.status(409).json({ error: 'Email already in use' });
  }

  const allowed = ['name', 'email', 'usn', 'class', 'section'];
  const updateMap = { name, email, usn, class: className, section };
  const fields = Object.keys(updateMap).filter(k => updateMap[k] !== undefined && allowed.includes(k));
  
  const sets = fields.map(f => `${f === 'class' ? '"class"' : f} = ?`).join(', ');
  const vals = fields.map(f => updateMap[f]);

  db.prepare(`UPDATE users SET ${sets} WHERE id = ?`).run(...vals, req.session.userId);

  const user = db.prepare(`SELECT ${SAFE_USER_COLS} FROM users WHERE id = ?`).get(req.session.userId);
  res.json(user);
});

// PATCH /api/users/me/avatar — upload avatar
router.patch('/me/avatar', uploadAvatar.single('avatar'), (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatarUrl, req.session.userId);
  
  res.json({ avatar: avatarUrl });
});

// PATCH /api/users/me/password — change own password
router.patch('/me/password', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both current and new password required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });

  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.session.userId);
  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.session.userId);
  res.json({ ok: true });
});

// GET /api/users
router.get('/', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const { role } = req.query;
  let sql = `SELECT ${SAFE_USER_COLS} FROM users WHERE 1=1`;
  const params = [];

  if (role && role !== 'All') { sql += ' AND role = ?'; params.push(role.toUpperCase()); }

  sql += ' ORDER BY name ASC';
  const users = db.prepare(sql).all(...params);
  res.json(users);
});

// PATCH /api/users/:id
router.patch('/:id', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const caller = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.userId);
  if (caller?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

  const updates = req.body;
  const allowed = ['role', 'status', 'name', 'email', 'usn', 'class', 'section'];
  const fields = Object.keys(updates).filter(k => allowed.includes(k));
  if (fields.length === 0) return res.status(400).json({ error: 'No valid fields' });

  const sets = fields.map(f => `${f === 'class' ? '"class"' : f} = ?`).join(', ');
  const vals = fields.map(f => updates[f]);
  db.prepare(`UPDATE users SET ${sets} WHERE id = ?`).run(...vals, req.params.id);

  const user = db.prepare(`SELECT ${SAFE_USER_COLS} FROM users WHERE id = ?`).get(req.params.id);

  if (req.app.locals.auditLog) {
    req.app.locals.auditLog(req.session.userId, 'user_update', 'user', req.params.id, `Updated: ${fields.join(', ')}`);
  }

  res.json(user);
});

// PATCH /api/users/:id/suspend
router.patch('/:id/suspend', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const caller = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.userId);
  if (caller?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });

  const newStatus = target.status === 'Suspended' ? 'Active' : 'Suspended';
  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(newStatus, req.params.id);

  if (req.app.locals.auditLog) {
    req.app.locals.auditLog(req.session.userId, `user_${newStatus.toLowerCase()}`, 'user', req.params.id, `${target.name} → ${newStatus}`);
  }

  if (req.app.locals.notify) {
    req.app.locals.notify(parseInt(req.params.id), {
      type: 'warning',
      title: newStatus === 'Suspended' ? 'Account Suspended' : 'Account Reactivated',
      body: newStatus === 'Suspended' ? 'Your account has been suspended by an admin.' : 'Your account has been reactivated.',
      link: '/settings'
    });
  }

  const user = db.prepare(`SELECT ${SAFE_USER_COLS} FROM users WHERE id = ?`).get(req.params.id);
  res.json(user);
});

// PATCH /api/users/:id/role
router.patch('/:id/role', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const caller = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.userId);
  if (caller?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

  const { role } = req.body;
  if (!['ADMIN', 'TEACHER', 'STUDENT'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const target = db.prepare('SELECT name FROM users WHERE id = ?').get(req.params.id);
  if (!target) return res.status(404).json({ error: 'User not found' });

  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);

  if (req.app.locals.auditLog) {
    req.app.locals.auditLog(req.session.userId, 'user_role_change', 'user', req.params.id, `${target.name} → ${role}`);
  }

  const user = db.prepare(`SELECT ${SAFE_USER_COLS} FROM users WHERE id = ?`).get(req.params.id);
  res.json(user);
});

export default router;
