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
import streakRoutes from './routes/streaks.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Seed database on first run
seed();

const app = express();
app.set('trust proxy', 1);

app.locals.auditLog = (actor_id, action, target_type, target_id, details) => {
  try {
    db.prepare('INSERT INTO audit_log (actor_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)').run(actor_id, action, target_type, target_id, details);
  } catch (err) {
    console.error('Audit Log Error:', err);
  }
};

const server = createServer(app);

// ─── Security Middleware ───
app.use(helmet({
  contentSecurityPolicy: false,  // Disabled for CDN Tailwind
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false // Allows Google Auth Popup to communicate back
}));

// Global rate limit: 1000 requests per 15 minutes (generous for SPA)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});
app.use('/api/', globalLimiter);

// Strict rate limit for auth attempts (login/register only, not session checks)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

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
app.use('/api/streaks', streakRoutes);

// ─── Health Check ───
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

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
  const days = parseInt(req.query.days) || 7;

  // Real Counts
  const activeUsers = db.prepare("SELECT COUNT(*) as c FROM users WHERE status = 'Active'").get().c;
  const totalResources = db.prepare('SELECT COUNT(*) as c FROM resources').get().c;
  
  // Real Trends
  const newUsers = db.prepare(`SELECT COUNT(*) as c FROM users WHERE status = 'Active' AND date_joined >= datetime('now', '-${days} days')`).get().c;
  const userGrowth = activeUsers > 0 ? ((newUsers / Math.max(1, activeUsers - newUsers)) * 100) : 0;
  
  const newResources = db.prepare(`SELECT COUNT(*) as c FROM resources WHERE created_at >= datetime('now', '-${days} days')`).get().c;
  const resGrowth = totalResources > 0 ? ((newResources / Math.max(1, totalResources - newResources)) * 100) : 0;

  // Real Storage Size (Uploads directory)
  let dirSize = 0;
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    files.forEach(file => {
      const stats = fs.statSync(path.join(UPLOAD_DIR, file));
      dirSize += stats.size;
    });
  } catch (e) {}
  const mbSize = (dirSize / (1024 * 1024)).toFixed(1);
  const storagePct = Math.min(100, Math.round((dirSize / (100 * 1024 * 1024 * 1024)) * 100)); // Assume 100GB disk

  // Real Uptime
  const uptimeHours = (process.uptime() / 3600).toFixed(1);

  // Engagement Chart (Last N Days of Messages)
  const engagement = [];
  for (let i = days - 1; i >= 0; i--) {
    const dateStr = db.prepare(`SELECT date(datetime('now', '-${i} days')) as d`).get().d;
    const count = db.prepare(`SELECT COUNT(*) as c FROM chat_messages WHERE date(created_at) = ?`).get(dateStr).c;
    engagement.push(count);
  }

  // Normalize engagement to percentages for the bar chart
  const maxEng = Math.max(...engagement, 10);
  const engagementPct = engagement.map(val => Math.round((val / maxEng) * 100));

  res.json({
    activeUsers: { val: activeUsers.toLocaleString(), trend: `+${Math.round(userGrowth)}%`, pct: Math.min(100, Math.round(activeUsers / 10)) },
    totalResources: { val: totalResources.toLocaleString(), trend: `+${Math.round(resGrowth)}%`, pct: Math.min(100, Math.round(totalResources / 10)) },
    storageUsed: { val: `${mbSize} MB`, trend: 'Local', pct: storagePct === 0 ? 5 : storagePct },
    systemUptime: { val: `${uptimeHours}h`, trend: 'Healthy', pct: 100 },
    engagement: engagementPct
  });
});

// ─── Serve frontend in production ───
if (isProd) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get(/(.*)/, (req, res) => {
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
