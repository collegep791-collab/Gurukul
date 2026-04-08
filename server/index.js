import express from 'express';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import seed from './seed.js';
import db from './db.js';
import authRoutes from './routes/auth.js';
import resourceRoutes from './routes/resources.js';
import chatRoutes from './routes/chat.js';
import notesRoutes from './routes/notes.js';
import usersRoutes from './routes/users.js';
import settingsRoutes from './routes/settings.js';
import assignmentRoutes from './routes/assignments.js';
import notificationRoutes from './routes/notifications.js';
import auditRoutes from './routes/audit.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Seed database on first run
seed();

const app = express();
const server = createServer(app);

// ─── Security Middleware ───
app.use(helmet({
  contentSecurityPolicy: false,  // Disabled for CDN Tailwind
  crossOriginEmbedderPolicy: false
}));

// Global rate limit: 300 requests per 15 minutes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});
app.use('/api/', globalLimiter);

// Strict rate limit for auth: 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' }
});
app.use('/api/auth/login', authLimiter);

// ─── Core Middleware ───
app.use(cors({
  origin: isProd ? (process.env.FRONTEND_URL || false) : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(UPLOAD_DIR));

const sessionMiddleware = session({
  secret: isProd
    ? (process.env.SESSION_SECRET || (() => { console.warn('⚠️  SESSION_SECRET not set!'); return 'insecure-fallback'; })())
    : 'gurukul-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProd,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  }
});
app.use(sessionMiddleware);

// ─── API Routes ───
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);

// ─── Moderation ───
app.get('/api/moderation', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const items = db.prepare(`
    SELECT mq.*, u.name as user_name, u.avatar as user_avatar
    FROM moderation_queue mq
    JOIN users u ON mq.user_id = u.id
    WHERE mq.status = 'Pending'
    ORDER BY mq.created_at DESC
  `).all();
  res.json(items);
});

app.patch('/api/moderation/:id', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const { status } = req.body;
  if (!['Approved', 'Rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE moderation_queue SET status = ? WHERE id = ?').run(status, req.params.id);
  // Audit log
  db.prepare('INSERT INTO audit_log (actor_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)')
    .run(req.session.userId, `moderation_${status.toLowerCase()}`, 'moderation', req.params.id, `Moderation item ${status}`);
  res.json({ ok: true });
});

// ─── Metrics ───
app.get('/api/metrics', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const activeUsers = db.prepare("SELECT COUNT(*) as c FROM users WHERE status = 'Active'").get().c;
  const totalResources = db.prepare('SELECT COUNT(*) as c FROM resources').get().c;
  const totalMessages = db.prepare('SELECT COUNT(*) as c FROM chat_messages').get().c;
  const totalAssignments = db.prepare('SELECT COUNT(*) as c FROM assignments').get().c;

  res.json({
    activeUsers: { val: activeUsers.toLocaleString(), trend: '+12%', pct: 75 },
    totalResources: { val: totalResources.toLocaleString(), trend: '+8%', pct: 60 },
    storageUsed: { val: '42.8 GB', trend: 'Local', pct: 42 },
    systemUptime: { val: '99.98%', trend: 'Healthy', pct: 99 }
  });
});

// ─── Serve frontend in production ───
if (isProd) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ─── WebSocket Server ───
const wss = new WebSocketServer({ server, path: '/ws' });
const clients = new Map(); // userId → Set<ws>

wss.on('connection', (ws, req) => {
  let userId = null;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'auth') {
        userId = msg.userId;
        if (!clients.has(userId)) clients.set(userId, new Set());
        clients.get(userId).add(ws);
        ws.send(JSON.stringify({ type: 'auth_ok' }));
      }

      // Typing indicator relay
      if (msg.type === 'typing' && msg.channelId) {
        const members = db.prepare('SELECT user_id FROM chat_channel_members WHERE channel_id = ?').all(msg.channelId);
        const payload = JSON.stringify({ type: 'typing', channelId: msg.channelId, userId, userName: msg.userName });
        for (const { user_id } of members) {
          if (user_id === userId) continue; // Don't echo back to sender
          const sockets = clients.get(user_id);
          if (sockets) for (const s of sockets) { if (s.readyState === 1) s.send(payload); }
        }
      }
    } catch (e) {
      // ignore malformed messages
    }
  });

  ws.on('close', () => {
    if (userId && clients.has(userId)) {
      clients.get(userId).delete(ws);
      if (clients.get(userId).size === 0) clients.delete(userId);
    }
  });
});

// ─── Broadcast helpers ───
// Chat broadcast
app.locals.broadcastToChannel = (channelId, payload) => {
  const members = db.prepare('SELECT user_id FROM chat_channel_members WHERE channel_id = ?').all(channelId);
  const jsonPayload = JSON.stringify(payload);
  for (const { user_id } of members) {
    const sockets = clients.get(user_id);
    if (sockets) for (const ws of sockets) { if (ws.readyState === 1) ws.send(jsonPayload); }
  }
};

// Notification dispatch: saves to DB + pushes via WebSocket
app.locals.notify = (userId, { type = 'info', title, body = '', link = '' }) => {
  const result = db.prepare(
    'INSERT INTO notifications (user_id, type, title, body, link) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, type, title, body, link);

  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(result.lastInsertRowid);

  // Push in real-time if user is connected
  const sockets = clients.get(userId);
  if (sockets) {
    const payload = JSON.stringify({ type: 'notification', notification });
    for (const ws of sockets) { if (ws.readyState === 1) ws.send(payload); }
  }

  return notification;
};

// Audit log helper
app.locals.auditLog = (actorId, action, targetType, targetId, details = '') => {
  db.prepare('INSERT INTO audit_log (actor_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)')
    .run(actorId, action, targetType, targetId, details);
};

// ─── Start ───
server.listen(PORT, () => {
  console.log(`\n🏛️  Gurukul API Server running on http://localhost:${PORT}`);
  console.log(`   WebSocket:  ws://localhost:${PORT}/ws`);
  console.log(`   Uploads:    ${UPLOAD_DIR}`);
  if (!isProd) console.log(`   Frontend:   http://localhost:5173 (Vite dev server)\n`);
});
