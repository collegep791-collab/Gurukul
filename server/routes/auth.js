/**
 * server/routes/auth.js
 * 
 * Technical Component: Authentication Controller
 * Description: Handles secure user authentication flows including traditional 
 * email/password login (using bcrypt for password hashing), user registration 
 * (with strict USN validation), and Google OAuth integration. Upon successful 
 * authentication, it provisions a JWT cookie via the jwt.js module.
 */
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import supabase from '../supabase.js';
import { setAuthCookie, clearAuthCookie } from '../jwt.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) return res.status(400).json({ error: 'Email, password, and role required' });

  // Input validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', email.trim())
      .single();

    if (error || !user) return res.status(401).json({ error: 'Invalid email or password' });

    // Check if suspended
    if (user.status === 'Suspended') return res.status(403).json({ error: 'Account suspended. Contact an administrator.' });

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    // Enforce Role
    if (user.role !== role) {
      return res.status(403).json({ error: `Account exists but is restricted from this portal. Please select your proper role.` });
    }

    // Set JWT cookie
    setAuthCookie(res, user.id);

    const { password_hash, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, usn, class: studentClass, section } = req.body;
  
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required' });

  // USN Validation: Enforce the '1RL24SCSXX' format strictly
  if (usn) {
    const usnRegex = /^1RL24SCS[A-Z0-9]{2}$/i;
    if (!usnRegex.test(usn.trim())) {
      return res.status(400).json({ error: 'Invalid USN format. Must be like 1RL24SCSXX' });
    }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .ilike('email', email.trim())
      .single();

    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const hash = bcrypt.hashSync(password, 10);
    const userRole = 'STUDENT'; // Force to STUDENT securely
    
    // Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password_hash: hash,
        role: userRole,
        usn: (usn || '').trim(),
        class: (studentClass || '').trim(),
        section: (section || '').trim()
      })
      .select()
      .single();

    if (insertError || !newUser) throw insertError;
    
    // Set JWT cookie
    setAuthCookie(res, newUser.id);
    
    // Log activity and join default channel
    await supabase.from('user_activity').insert({ user_id: newUser.id, activity_type: 'login' });
    
    const { data: globalHub } = await supabase.from('chat_channels').select('id').eq('name', 'Campus Hub').single();
    if (globalHub) {
      await supabase.from('chat_channel_members').upsert({ channel_id: globalHub.id, user_id: newUser.id }, { onConflict: 'channel_id,user_id' });
    }
    
    const { password_hash: _ph, ...safeUser } = newUser;
    res.json(safeUser);
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Google credential required' });

  try {
    // Verify token with google
    const response = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + credential);
    if (!response.ok) return res.status(401).json({ error: 'Invalid Google credential' });
    
    const tokenInfo = await response.json();
    const email = tokenInfo.email.toLowerCase();
    const name = tokenInfo.name || email.split('@')[0];
    const picture = tokenInfo.picture || '';
    
    let { data: user } = await supabase.from('users').select('*').eq('email', email).single();
    
    if (!user) {
      // Create user
      const placeholderHash = bcrypt.hashSync(Math.random().toString(36).slice(-8), 10);
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          name,
          email,
          password_hash: placeholderHash,
          role: 'STUDENT',
          avatar: picture
        })
        .select()
        .single();
        
      if (error) throw error;
      user = newUser;
    } else if (user.status === 'Suspended') {
      return res.status(403).json({ error: 'Account suspended. Contact an administrator.' });
    }
    
    // Set JWT cookie
    setAuthCookie(res, user.id);
    
    // Activity tracking
    await supabase.from('user_activity').insert({ user_id: user.id, activity_type: 'login' });
    
    const { data: globalHub } = await supabase.from('chat_channels').select('id').eq('name', 'Campus Hub').single();
    if (globalHub) {
      await supabase.from('chat_channel_members').upsert({ channel_id: globalHub.id, user_id: user.id }, { onConflict: 'channel_id,user_id' });
    }

    const { password_hash: _ph, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const { data: user, error } = await supabase.from('users').select('*').eq('id', req.userId).single();
    if (error || !user) return res.status(401).json({ error: 'User not found' });

    const { password_hash, ...safeUser } = user;

    // Fetch settings
    const { data: settings } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single();
    res.json({ ...safeUser, settings: settings || null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

export default router;
