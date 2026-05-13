import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import seed from './seed.js';
import supabase from './supabase.js';
import { jwtMiddleware } from './jwt.js';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// Seed database on first run
seed();

const app = express();
app.set('trust proxy', 1);

app.locals.auditLog = async (actor_id, action, target_type, target_id, details) => {
  try {
    await supabase.from('audit_log').insert({ actor_id, action, target_type, target_id, details });
  } catch (err) {
    console.error('Audit Log Error:', err);
  }
};

// ─── Security Middleware ───
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false
}));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});
app.use('/api/', globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ─── Core Middleware ───
app.use(cors({
  origin: isProd ? (process.env.FRONTEND_URL || true) : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(jwtMiddleware);

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
  res.json({ status: 'ok', serverless: true });
});

// ─── Moderation ───
app.get('/api/moderation', async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const { data, error } = await supabase
      .from('moderation_queue')
      .select('*, user:users!user_id(name, avatar)')
      .eq('status', 'Pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    const items = data.map(i => ({ ...i, user_name: i.user?.name, user_avatar: i.user?.avatar }));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch moderation queue' });
  }
});

app.patch('/api/moderation/:id', async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'Not authenticated' });
  const { status } = req.body;
  if (!['Approved', 'Rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  
  try {
    await supabase.from('moderation_queue').update({ status }).eq('id', req.params.id);
    app.locals.auditLog(req.userId, `moderation_${status.toLowerCase()}`, 'moderation', req.params.id, `Moderation item ${status}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update moderation' });
  }
});

// ─── Metrics ───
app.get('/api/metrics', async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    const { count: activeUsers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'Active');
    const { count: totalResources } = await supabase.from('resources').select('*', { count: 'exact', head: true });
    
    // Engagement Chart
    const engagement = [12, 18, 15, 25, 22, 35, 45]; 
    const maxEng = Math.max(...engagement);
    const engagementPct = engagement.map(val => Math.round((val / maxEng) * 100));

    res.json({
      activeUsers: { val: (activeUsers || 0).toLocaleString(), trend: '+15%', pct: 75 },
      totalResources: { val: (totalResources || 0).toLocaleString(), trend: '+8%', pct: 45 },
      storageUsed: { val: 'Cloud', trend: 'Supabase', pct: 10 },
      systemUptime: { val: `${(process.uptime() / 3600).toFixed(1)}h`, trend: 'Healthy', pct: 100 },
      engagement: engagementPct
    });
  } catch (err) {
    res.status(500).json({ error: 'Metrics failed' });
  }
});

// ─── Vercel Fallback (Stubs for old WebSocket broadcast) ───
// Since Vercel is serverless, the frontend will connect directly to Supabase Realtime instead of an Express WebSocket.
app.locals.broadcastToChannel = async (channelId, payload) => {};
app.locals.notify = async (userId, payload) => {
  const { data: notification } = await supabase
    .from('notifications')
    .insert({ user_id: userId, type: payload.type || 'info', title: payload.title, body: payload.body || '', link: payload.link || '' })
    .select()
    .single();
  return notification;
};

// ─── Start ───
// For local development only. Vercel will export the app without calling listen.
if (process.env.NODE_ENV !== 'production' || process.env.RUN_LOCAL_SERVER === 'true') {
  app.listen(PORT, () => {
    console.log(`\n🏛️  Gurukul Serverless API ready on http://localhost:${PORT}`);
    if (!isProd) console.log(`   Frontend:   http://localhost:5173 (Vite dev server)\n`);
  });
}

// Export for Vercel
export default app;
