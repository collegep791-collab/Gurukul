import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}-${file.originalname.replace(/\s+/g, '_')}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|doc|docx|ppt|pptx|xls|xlsx|txt|md|mp4|mp3|wav|png|jpg|jpeg|gif|webp|zip/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error(`File type .${ext} not allowed`));
  }
});

const router = Router();

// GET /api/resources
router.get('/', (req, res) => {
  const { type, category, featured, search } = req.query;
  let sql = `
    SELECT r.*, u.name as uploader_name, u.avatar as uploader_avatar
    FROM resources r
    LEFT JOIN users u ON r.uploader_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (type && type !== 'All') { sql += ' AND r.type = ?'; params.push(type); }
  if (category) { sql += ' AND r.category = ?'; params.push(category); }
  if (featured === '1') { sql += ' AND r.featured = 1'; }
  if (search) { sql += ' AND (r.title LIKE ? OR r.category LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  sql += ' ORDER BY r.created_at DESC';

  const resources = db.prepare(sql).all(...params);
  res.json(resources);
});

// GET /api/resources/:id
router.get('/:id', (req, res) => {
  const resource = db.prepare(`
    SELECT r.*, u.name as uploader_name FROM resources r
    LEFT JOIN users u ON r.uploader_id = u.id
    WHERE r.id = ?
  `).get(req.params.id);
  if (!resource) return res.status(404).json({ error: 'Resource not found' });

  // Increment views
  db.prepare('UPDATE resources SET views = views + 1 WHERE id = ?').run(req.params.id);
  res.json(resource);
});

// GET /api/resources/:id/download
router.get('/:id/download', (req, res) => {
  const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);
  if (!resource) return res.status(404).json({ error: 'Resource not found' });
  if (!resource.file_path) return res.status(404).json({ error: 'No file attached to this resource' });

  const filePath = path.join(UPLOAD_DIR, resource.file_path);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });

  // Increment downloads
  db.prepare('UPDATE resources SET downloads = downloads + 1 WHERE id = ?').run(req.params.id);
  res.download(filePath, resource.file_path);
});

// POST /api/resources — supports both JSON and multipart/form-data
router.post('/', upload.single('file'), (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const { title, type, format, category, thumbnail } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });

  const filePath = req.file ? req.file.filename : '';
  const fileSize = req.file ? `${(req.file.size / (1024 * 1024)).toFixed(1)}MB` : (req.body.size || '');
  const fileFormat = req.file ? path.extname(req.file.originalname).slice(1).toUpperCase() : (format || 'PDF');

  const result = db.prepare(`
    INSERT INTO resources (title, type, format, size, file_path, uploader_id, category, status, thumbnail)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Live', ?)
  `).run(title, type || 'Document', fileFormat, fileSize, filePath, req.session.userId, category || '', thumbnail || '');

  const newResource = db.prepare('SELECT r.*, u.name as uploader_name FROM resources r LEFT JOIN users u ON r.uploader_id = u.id WHERE r.id = ?').get(result.lastInsertRowid);

  // Audit log
  if (req.app.locals.auditLog) {
    req.app.locals.auditLog(req.session.userId, 'resource_upload', 'resource', newResource.id, `Uploaded: ${title}`);
  }

  // Notify users who have notify_resources enabled
  const subscribers = db.prepare("SELECT user_id FROM user_settings WHERE notify_resources = 1 AND user_id != ?").all(req.session.userId);
  for (const { user_id } of subscribers) {
    if (req.app.locals.notify) {
      req.app.locals.notify(user_id, {
        type: 'resource',
        title: 'New Resource Available',
        body: `"${title}" was uploaded to the Resource Hub.`,
        link: '/resources'
      });
    }
  }

  res.status(201).json(newResource);
});

// DELETE /api/resources/:id
router.delete('/:id', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);
  if (resource && resource.file_path) {
    const filePath = path.join(UPLOAD_DIR, resource.file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  db.prepare('DELETE FROM resources WHERE id = ?').run(req.params.id);

  if (req.app.locals.auditLog) {
    req.app.locals.auditLog(req.session.userId, 'resource_delete', 'resource', req.params.id, `Deleted: ${resource?.title}`);
  }

  res.json({ ok: true });
});

// PATCH /api/resources/:id
router.patch('/:id', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const updates = req.body;
  const fields = Object.keys(updates).filter(k => ['title','type','format','size','category','status','featured','verified','thumbnail'].includes(k));
  if (fields.length === 0) return res.status(400).json({ error: 'No valid fields' });

  const sets = fields.map(f => `${f} = ?`).join(', ');
  const vals = fields.map(f => updates[f]);
  db.prepare(`UPDATE resources SET ${sets} WHERE id = ?`).run(...vals, req.params.id);

  const resource = db.prepare('SELECT r.*, u.name as uploader_name FROM resources r LEFT JOIN users u ON r.uploader_id = u.id WHERE r.id = ?').get(req.params.id);
  res.json(resource);
});

export default router;
