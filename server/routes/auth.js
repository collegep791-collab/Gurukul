import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';

const router = Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) return res.status(400).json({ error: 'Email, password, and role required' });

  // Input validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  // Check if suspended
  if (user.status === 'Suspended') return res.status(403).json({ error: 'Account suspended. Contact an administrator.' });

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  // Enforce Role
  if (user.role !== role) {
    return res.status(403).json({ error: `Account exists but is restricted from this portal. Please select your proper role.` });
  }

  // Store user id in session
  req.session.userId = user.id;

  const { password_hash, ...safeUser } = user;
  res.json(safeUser);
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password, usn, class: className, section } = req.body;
  
  if (!name || !email || !password || !usn || !className || !section) {
    return res.status(400).json({ error: 'All fields (Name, Email, Password, USN, Class, Section) are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  // USN Validation (Pattern: 1RL24SCSXX)
  const usnRegex = /^1RL24SCS\d{2}$/i;
  if (!usnRegex.test(usn)) {
    return res.status(400).json({ error: 'Invalid USN format. Required format: 1RL24SCSXX (e.g., 1RL24SCS01)' });
  }

  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (existing) return res.status(400).json({ error: 'Email already registered' });

  const existingUsn = db.prepare('SELECT id FROM users WHERE usn = ?').get(usn.trim().toUpperCase());
  if (existingUsn) return res.status(400).json({ error: 'USN already registered' });

  const hash = bcrypt.hashSync(password, 10);
  
  // Everyone registers as STUDENT by default for security. 
  // Admin must manually promote a user to TEACHER.
  const userRole = 'STUDENT';
  
  try {
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, usn, class, section) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name.trim(), email.trim().toLowerCase(), hash, userRole, usn.trim().toUpperCase(), className, section);
    
    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    req.session.userId = newUser.id;
    
    // Log activity for streak tracking
    try {
      db.prepare("INSERT INTO user_activity (user_id, activity_type) VALUES (?, 'login')").run(newUser.id);
      
      const globalHub = db.prepare("SELECT id FROM chat_channels WHERE name = 'Campus Hub'").get();
      if (globalHub) {
        db.prepare("INSERT OR IGNORE INTO chat_channel_members (channel_id, user_id) VALUES (?, ?)").run(globalHub.id, newUser.id);
      }
    } catch (e) {}
    
    const { password_hash: _ph, ...safeUser } = newUser;
    res.json(safeUser);
  } catch (err) {
    console.error('Registration Error:', err);
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
    
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user) {
      // Create user
      const placeholderHash = bcrypt.hashSync(Math.random().toString(36).slice(-8), 10);
      const result = db.prepare(`
        INSERT INTO users (name, email, password_hash, role, avatar) 
        VALUES (?, ?, ?, 'STUDENT', ?)
      `).run(name, email, placeholderHash, picture);
      
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    } else if (user.status === 'Suspended') {
      return res.status(403).json({ error: 'Account suspended. Contact an administrator.' });
    }
    
    req.session.userId = user.id;
    
    try {
      db.prepare("INSERT INTO user_activity (user_id, activity_type) VALUES (?, 'login')").run(user.id);
      
      const globalHub = db.prepare("SELECT id FROM chat_channels WHERE name = 'Campus Hub'").get();
      if (globalHub) {
        db.prepare("INSERT OR IGNORE INTO chat_channel_members (channel_id, user_id) VALUES (?, ?)").run(globalHub.id, user.id);
      }
    } catch (e) {}

    const { password_hash: _ph, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  if (!user) return res.status(401).json({ error: 'User not found' });

  const { password_hash, ...safeUser } = user;

  // Also fetch settings
  const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(user.id);
  res.json({ ...safeUser, settings });
});

export default router;
