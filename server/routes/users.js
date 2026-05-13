import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import supabase from '../supabase.js';

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

const router = Router();

// Auth guard middleware
const requireAuth = (req, res, next) => {
  if (!req.userId) return res.status(401).json({ error: 'Not authenticated' });
  next();
};

// Admin guard middleware
const requireAdmin = async (req, res, next) => {
  const { data: user } = await supabase.from('users').select('role').eq('id', req.userId).single();
  if (user?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });
  next();
};

// PATCH /api/users/me/avatar
router.patch('/me/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const ext = path.extname(req.file.originalname);
    const fileName = `avatar_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const avatarUrl = publicUrlData.publicUrl;

    const { data: user, error: updateError } = await supabase
      .from('users')
      .update({ avatar: avatarUrl })
      .eq('id', req.userId)
      .select('id, name, email, avatar, role, status, credits, streak, progress, date_joined')
      .single();

    if (updateError) throw updateError;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// PATCH /api/users/me — update own profile (name, email)
router.patch('/me', requireAuth, async (req, res) => {
  const { name, email } = req.body;
  if (!name && !email) return res.status(400).json({ error: 'Nothing to update' });

  try {
    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });
      // Check email not taken by another user
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .neq('id', req.userId)
        .single();
        
      if (existing) return res.status(409).json({ error: 'Email already in use' });
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.trim().toLowerCase();

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.userId)
      .select('id, name, email, avatar, role, status, credits, streak, progress, date_joined')
      .single();

    if (error) throw error;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PATCH /api/users/me/password — change own password
router.patch('/me/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both current and new password required' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });

  try {
    const { data: user } = await supabase.from('users').select('password_hash').eq('id', req.userId).single();

    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    await supabase.from('users').update({ password_hash: newHash }).eq('id', req.userId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// GET /api/users
router.get('/', requireAuth, async (req, res) => {
  const { role } = req.query;
  
  try {
    let query = supabase
      .from('users')
      .select('id, name, email, avatar, role, status, credits, streak, progress, date_joined')
      .order('name', { ascending: true });

    if (role && role !== 'All') {
      query = query.eq('role', role.toUpperCase());
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { name, email, password, role, usn, class: assignClass, section } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Full Name, email, and password required' });

  try {
    const { data: existing } = await supabase.from('users').select('id').eq('email', email.trim().toLowerCase()).single();
    if (existing) return res.status(409).json({ error: 'Email already exists' });

    const safeRole = ['STUDENT', 'TEACHER', 'ADMIN'].includes(role) ? role : 'STUDENT';
    const safeHash = bcrypt.hashSync(password, 10);

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password_hash: safeHash,
        role: safeRole,
        usn: (usn || '').trim(),
        class: (assignClass || '').trim(),
        section: (section || '').trim(),
        status: 'Active'
      })
      .select('id, name, email, avatar, role, status, credits, streak, progress, date_joined')
      .single();

    if (error) throw error;

    if (req.app.locals.auditLog) {
      req.app.locals.auditLog(req.userId, 'user_create', 'user', user.id, `Admin created user: ${user.email} (${user.role})`);
    }

    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PATCH /api/users/:id
router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  const updates = req.body;
  const allowed = ['role', 'status', 'name', 'email'];
  const updateData = {};
  
  allowed.forEach(k => {
    if (updates[k] !== undefined) updateData[k] = updates[k];
  });

  if (Object.keys(updateData).length === 0) return res.status(400).json({ error: 'No valid fields' });

  try {
    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.params.id)
      .select('id, name, email, avatar, role, status, date_joined')
      .single();

    if (error) throw error;

    if (req.app.locals.auditLog) {
      req.app.locals.auditLog(req.userId, 'user_update', 'user', req.params.id, `Updated fields`);
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// PATCH /api/users/:id/suspend — toggle Active/Suspended
router.patch('/:id/suspend', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { data: target } = await supabase.from('users').select('*').eq('id', req.params.id).single();
    if (!target) return res.status(404).json({ error: 'User not found' });

    const newStatus = target.status === 'Suspended' ? 'Active' : 'Suspended';
    
    const { data: user, error } = await supabase
      .from('users')
      .update({ status: newStatus })
      .eq('id', req.params.id)
      .select('id, name, email, avatar, role, status, date_joined')
      .single();

    if (error) throw error;

    if (req.app.locals.auditLog) {
      req.app.locals.auditLog(req.userId, `user_${newStatus.toLowerCase()}`, 'user', req.params.id, `${target.name} → ${newStatus}`);
    }

    if (req.app.locals.notify) {
      req.app.locals.notify(parseInt(req.params.id), {
        type: 'warning',
        title: newStatus === 'Suspended' ? 'Account Suspended' : 'Account Reactivated',
        body: newStatus === 'Suspended' ? 'Your account has been suspended by an admin.' : 'Your account has been reactivated.',
        link: '/settings'
      });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to change suspension status' });
  }
});

// PATCH /api/users/:id/role — change role (Admin only)
router.patch('/:id/role', requireAuth, requireAdmin, async (req, res) => {
  const { role } = req.body;
  if (!['ADMIN', 'TEACHER', 'STUDENT'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

  try {
    const { data: target } = await supabase.from('users').select('name').eq('id', req.params.id).single();
    if (!target) return res.status(404).json({ error: 'User not found' });

    const { data: user, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', req.params.id)
      .select('id, name, email, avatar, role, status, date_joined')
      .single();

    if (error) throw error;

    if (req.app.locals.auditLog) {
      req.app.locals.auditLog(req.userId, 'user_role_change', 'user', req.params.id, `${target.name} → ${role}`);
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to change role' });
  }
});

export default router;
