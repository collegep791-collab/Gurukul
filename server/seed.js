import db from './db.js';
import bcrypt from 'bcryptjs';

const SALT = bcrypt.genSaltSync(10);
const hash = (pw) => bcrypt.hashSync(pw, SALT);

export default function seed() {
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (count > 0) {
    console.log('📦 Database already seeded. Skipping.');
    return;
  }

  console.log('🌱 Seeding database...');

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, avatar, role, status, credits, streak, progress, date_joined)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const users = [];

  // Admins & Teachers
  users.push({ name: 'System Admin', email: 'admin@gurukul.edu', pw: 'password123', avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Admin', role: 'ADMIN', status: 'Active', credits: 5000, streak: 100, progress: 99, joined: '2021-10-15' });
  users.push({ name: 'Prof. Guide', email: 'teacher@gurukul.edu', pw: 'password123', avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Teacher', role: 'TEACHER', status: 'Active', credits: 3200, streak: 45, progress: 92, joined: '2022-01-05' });
  users.push({ name: 'Student One', email: 'student@gurukul.edu', pw: 'password123', avatar: 'https://api.dicebear.com/9.x/notionists/svg?seed=Student', role: 'STUDENT', status: 'Active', credits: 1240, streak: 12, progress: 68, joined: '2023-08-15' });

  const insertUsers = db.transaction(() => {
    for (const u of users) {
      insertUser.run(u.name, u.email, hash(u.pw), u.avatar, u.role, u.status, u.credits, u.streak, u.progress, u.joined);
    }
  });
  insertUsers();

  // ─── Settings ───
  const insertSettings = db.prepare(`INSERT INTO user_settings (user_id, theme, two_factor, notify_resources, notify_mentions, notify_updates) VALUES (?, ?, ?, ?, ?, ?)`);
  db.transaction(() => {
    for (let i = 1; i <= Object.keys(users).length; i++) {
      insertSettings.run(i, 'light', 1, 1, 1, 0);
    }
  })();

  // ─── Global Chat Channel ───
  const globalChannelId = db.prepare(`INSERT INTO chat_channels (name, description, type) VALUES ('Campus Hub', 'Global announcements and general chat for all students and faculty.', 'channel')`).run().lastInsertRowid;
  const insertMember = db.prepare('INSERT INTO chat_channel_members (channel_id, user_id) VALUES (?, ?)');
  db.transaction(() => {
    for (let i = 1; i <= Object.keys(users).length; i++) {
      insertMember.run(globalChannelId, i);
    }
  })();

  console.log('✅ Database seeded with base users and Campus Hub channel.');
}
