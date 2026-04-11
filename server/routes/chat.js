import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/chat/channels — channels the user belongs to
router.get('/channels', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const channels = db.prepare(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM chat_channel_members WHERE channel_id = c.id) as member_count,
      (SELECT text FROM chat_messages WHERE channel_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
    FROM chat_channels c
    JOIN chat_channel_members cm ON cm.channel_id = c.id
    WHERE cm.user_id = ?
    ORDER BY c.created_at ASC
  `).all(req.session.userId);

  res.json(channels);
});

// POST /api/chat/channels — create class group and auto-enroll
router.post('/channels', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  const caller = db.prepare('SELECT role FROM users WHERE id = ?').get(req.session.userId);
  if (caller?.role === 'STUDENT') return res.status(403).json({ error: 'Students cannot create channels' });

  const { name, description, class: targetClass, section } = req.body;
  if (!name) return res.status(400).json({ error: 'Channel name required' });
  
  const result = db.prepare('INSERT INTO chat_channels (name, description, type, created_by) VALUES (?, ?, ?, ?)').run(
    name.trim(), (description || '').trim(), 'channel', req.session.userId
  );
  const newChannelId = result.lastInsertRowid;

  // Add the creator
  db.prepare('INSERT INTO chat_channel_members (channel_id, user_id) VALUES (?, ?)').run(newChannelId, req.session.userId);

  // Auto-enroll all matching students if target class and section are provided
  if (targetClass && section) {
    const students = db.prepare('SELECT id FROM users WHERE role = ? AND class = ? AND section = ? AND status = ?').all('STUDENT', targetClass, section, 'Active');
    const insertMember = db.prepare('INSERT OR IGNORE INTO chat_channel_members (channel_id, user_id) VALUES (?, ?)');
    students.forEach(s => {
      if (s.id !== req.session.userId) insertMember.run(newChannelId, s.id);
    });
  }

  const channel = db.prepare('SELECT *, 1 as member_count FROM chat_channels WHERE id = ?').get(newChannelId);
  res.status(201).json(channel);
});

// GET /api/chat/channels/:id/messages?before=<id>&limit=50
router.get('/channels/:id/messages', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const before = req.query.before ? parseInt(req.query.before) : null;

  let messages;
  if (before) {
    // Cursor pagination: get messages older than `before` id
    messages = db.prepare(`
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
      FROM chat_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.channel_id = ? AND m.id < ?
      ORDER BY m.created_at DESC
      LIMIT ?
    `).all(req.params.id, before, limit).reverse();
  } else {
    // Get latest messages
    messages = db.prepare(`
      SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
      FROM chat_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.channel_id = ?
      ORDER BY m.created_at DESC
      LIMIT ?
    `).all(req.params.id, limit).reverse();
  }

  res.json(messages);
});

// GET /api/chat/channels/:id/pinned
router.get('/channels/:id/pinned', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const pinned = db.prepare(`
    SELECT m.*, u.name as sender_name
    FROM chat_messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.channel_id = ? AND m.pinned = 1
    ORDER BY m.created_at DESC
  `).all(req.params.id);

  res.json(pinned);
});

// GET /api/chat/channels/:id/members
router.get('/channels/:id/members', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const members = db.prepare(`
    SELECT u.id, u.name, u.avatar, u.role, u.status
    FROM users u
    JOIN chat_channel_members cm ON cm.user_id = u.id
    WHERE cm.channel_id = ?
  `).all(req.params.id);

  res.json(members);
});

// POST /api/chat/channels/:id/messages
router.post('/channels/:id/messages', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const { text, attachment } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Message text required' });

  const result = db.prepare(`
    INSERT INTO chat_messages (channel_id, sender_id, text, attachment_json)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, req.session.userId, text, attachment ? JSON.stringify(attachment) : null);

  const message = db.prepare(`
    SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
    FROM chat_messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.id = ?
  `).get(result.lastInsertRowid);

  // Broadcast via WebSocket (handled in index.js)
  if (req.app.locals.broadcastToChannel) {
    req.app.locals.broadcastToChannel(parseInt(req.params.id), {
      type: 'new_message',
      channelId: parseInt(req.params.id),
      message
    });
  }

  res.status(201).json(message);
});

// POST /api/chat/dm — create or get existing DM channel between two users
router.post('/dm', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const { targetUserId } = req.body;
  if (!targetUserId) return res.status(400).json({ error: 'Target user ID required' });
  if (targetUserId === req.session.userId) return res.status(400).json({ error: 'Cannot DM yourself' });

  // Check if DM already exists between these two users
  const existing = db.prepare(`
    SELECT c.id FROM chat_channels c
    WHERE c.type = 'dm'
      AND (SELECT COUNT(*) FROM chat_channel_members WHERE channel_id = c.id) = 2
      AND EXISTS (SELECT 1 FROM chat_channel_members WHERE channel_id = c.id AND user_id = ?)
      AND EXISTS (SELECT 1 FROM chat_channel_members WHERE channel_id = c.id AND user_id = ?)
  `).get(req.session.userId, targetUserId);

  if (existing) {
    const channel = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM chat_channel_members WHERE channel_id = c.id) as member_count,
        (SELECT text FROM chat_messages WHERE channel_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
      FROM chat_channels c WHERE c.id = ?
    `).get(existing.id);
    return res.json(channel);
  }

  // Create new DM
  const targetUser = db.prepare('SELECT name FROM users WHERE id = ?').get(targetUserId);
  const currentUser = db.prepare('SELECT name FROM users WHERE id = ?').get(req.session.userId);
  if (!targetUser) return res.status(404).json({ error: 'User not found' });

  const dmName = `${currentUser.name.split(' ')[0]} & ${targetUser.name.split(' ')[0]}`;
  const result = db.prepare(`INSERT INTO chat_channels (name, description, type) VALUES (?, 'Direct Message', 'dm')`).run(dmName);
  const channelId = result.lastInsertRowid;

  db.prepare('INSERT INTO chat_channel_members (channel_id, user_id) VALUES (?, ?)').run(channelId, req.session.userId);
  db.prepare('INSERT INTO chat_channel_members (channel_id, user_id) VALUES (?, ?)').run(channelId, targetUserId);

  const channel = db.prepare(`
    SELECT c.*,
      (SELECT COUNT(*) FROM chat_channel_members WHERE channel_id = c.id) as member_count,
      (SELECT text FROM chat_messages WHERE channel_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
    FROM chat_channels c WHERE c.id = ?
  `).get(channelId);

  res.status(201).json(channel);
});

export default router;
