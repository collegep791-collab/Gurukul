import { Router } from 'express';
import supabase from '../supabase.js';

const router = Router();

// GET /api/chat/channels — channels the user belongs to
router.get('/channels', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    // We need channels the user is a member of, along with member count and last message.
    // In Supabase, this requires multiple steps or a complex join.
    // 1. Get channel IDs the user is in
    const { data: members, error: e1 } = await supabase
      .from('chat_channel_members')
      .select('channel_id')
      .eq('user_id', req.session.userId);
      
    if (e1) throw e1;
    
    const channelIds = members.map(m => m.channel_id);
    if (channelIds.length === 0) return res.json([]);

    // 2. Get channels
    const { data: channels, error: e2 } = await supabase
      .from('chat_channels')
      .select('*, members:chat_channel_members(user_id), messages:chat_messages(text, created_at)')
      .in('id', channelIds)
      .order('created_at', { ascending: true });

    if (e2) throw e2;

    const formatted = channels.map(c => {
      // Find latest message manually
      const msgs = c.messages || [];
      msgs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      return {
        id: c.id,
        name: c.name,
        description: c.description,
        type: c.type,
        created_by: c.created_by,
        created_at: c.created_at,
        member_count: c.members?.length || 0,
        last_message: msgs[0]?.text || null
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Chat GET error:', err);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// POST /api/chat/channels — create class group and auto-enroll
router.post('/channels', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  
  try {
    const { data: caller } = await supabase.from('users').select('role').eq('id', req.session.userId).single();
    if (caller?.role === 'STUDENT') return res.status(403).json({ error: 'Students cannot create channels' });

    const { name, description, class: targetClass, section } = req.body;
    if (!name) return res.status(400).json({ error: 'Channel name required' });
    
    const { data: channel, error: cErr } = await supabase
      .from('chat_channels')
      .insert({
        name: name.trim(),
        description: (description || '').trim(),
        type: 'channel',
        created_by: req.session.userId
      })
      .select()
      .single();

    if (cErr) throw cErr;

    // Add creator
    const membersToInsert = [{ channel_id: channel.id, user_id: req.session.userId }];

    // Auto-enroll
    if (targetClass && section) {
      const { data: students } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'STUDENT')
        .eq('class', targetClass)
        .eq('section', section)
        .eq('status', 'Active');
        
      if (students) {
        students.forEach(s => {
          if (s.id !== req.session.userId) membersToInsert.push({ channel_id: channel.id, user_id: s.id });
        });
      }
    }

    await supabase.from('chat_channel_members').upsert(membersToInsert, { onConflict: 'channel_id,user_id' });

    res.status(201).json({ ...channel, member_count: membersToInsert.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

// GET /api/chat/channels/:id/messages?before=<id>&limit=50
router.get('/channels/:id/messages', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const before = req.query.before ? parseInt(req.query.before) : null;

  try {
    let query = supabase
      .from('chat_messages')
      .select('*, sender:users!sender_id(name, avatar)')
      .eq('channel_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('id', before);
    }

    const { data, error } = await query;
    if (error) throw error;

    const formatted = data.reverse().map(m => ({
      ...m,
      sender_name: m.sender?.name,
      sender_avatar: m.sender?.avatar
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// GET /api/chat/channels/:id/pinned
router.get('/channels/:id/pinned', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*, sender:users!sender_id(name)')
      .eq('channel_id', req.params.id)
      .eq('pinned', 1)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const formatted = data.map(m => ({ ...m, sender_name: m.sender?.name }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pinned messages' });
  }
});

// GET /api/chat/channels/:id/members
router.get('/channels/:id/members', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { data, error } = await supabase
      .from('chat_channel_members')
      .select('users(id, name, avatar, role, status)')
      .eq('channel_id', req.params.id);

    if (error) throw error;
    
    const formatted = data.map(m => m.users).filter(Boolean);
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// POST /api/chat/channels/:id/messages
router.post('/channels/:id/messages', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const { text, attachment } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Message text required' });

  try {
    const { data: msgResult, error: msgErr } = await supabase
      .from('chat_messages')
      .insert({
        channel_id: req.params.id,
        sender_id: req.session.userId,
        text,
        attachment_json: attachment ? JSON.stringify(attachment) : null
      })
      .select('*, sender:users!sender_id(name, avatar)')
      .single();

    if (msgErr) throw msgErr;

    const message = {
      ...msgResult,
      sender_name: msgResult.sender?.name,
      sender_avatar: msgResult.sender?.avatar
    };

    // Broadcast via WebSocket (handled in index.js)
    if (req.app.locals.broadcastToChannel) {
      await req.app.locals.broadcastToChannel(parseInt(req.params.id), {
        type: 'new_message',
        channelId: parseInt(req.params.id),
        message
      });
    }

    res.status(201).json(message);
  } catch (err) {
    console.error('Message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// POST /api/chat/dm — create or get existing DM channel between two users
router.post('/dm', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const { targetUserId } = req.body;
  if (!targetUserId) return res.status(400).json({ error: 'Target user ID required' });
  if (targetUserId === req.session.userId) return res.status(400).json({ error: 'Cannot DM yourself' });

  try {
    // Find existing DM: we need a dm channel with exactly these two users
    // Since Supabase joins for this are complex, we fetch DM channels for current user, then check members
    const { data: myDMs } = await supabase
      .from('chat_channel_members')
      .select('channel_id, chat_channels!inner(type)')
      .eq('user_id', req.session.userId)
      .eq('chat_channels.type', 'dm');

    let existingId = null;
    if (myDMs && myDMs.length > 0) {
      const dmIds = myDMs.map(m => m.channel_id);
      const { data: targetDMs } = await supabase
        .from('chat_channel_members')
        .select('channel_id')
        .eq('user_id', targetUserId)
        .in('channel_id', dmIds);

      if (targetDMs && targetDMs.length > 0) {
        existingId = targetDMs[0].channel_id;
      }
    }

    if (existingId) {
      const { data: channel } = await supabase.from('chat_channels').select('*, members:chat_channel_members(user_id), messages:chat_messages(text, created_at)').eq('id', existingId).single();
      const msgs = channel.messages || [];
      msgs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return res.json({
        ...channel,
        member_count: channel.members?.length || 0,
        last_message: msgs[0]?.text || null
      });
    }

    // Create new DM
    const { data: targetUser } = await supabase.from('users').select('name').eq('id', targetUserId).single();
    const { data: currentUser } = await supabase.from('users').select('name').eq('id', req.session.userId).single();
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const dmName = `${currentUser.name.split(' ')[0]} & ${targetUser.name.split(' ')[0]}`;
    
    const { data: channel, error: dmErr } = await supabase
      .from('chat_channels')
      .insert({ name: dmName, description: 'Direct Message', type: 'dm' })
      .select()
      .single();

    if (dmErr) throw dmErr;

    await supabase.from('chat_channel_members').insert([
      { channel_id: channel.id, user_id: req.session.userId },
      { channel_id: channel.id, user_id: targetUserId }
    ]);

    res.status(201).json({ ...channel, member_count: 2, last_message: null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create DM' });
  }
});

export default router;
