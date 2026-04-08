import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'gurukul.db');

// Ensure data directory exists
import fs from 'fs';
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    role TEXT CHECK(role IN ('ADMIN','TEACHER','STUDENT')) DEFAULT 'STUDENT',
    status TEXT CHECK(status IN ('Active','Inactive','Suspended')) DEFAULT 'Active',
    credits INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0,
    date_joined TEXT DEFAULT (date('now')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT CHECK(type IN ('Document','Video','Audio','Image')) DEFAULT 'Document',
    format TEXT DEFAULT '',
    size TEXT DEFAULT '',
    file_path TEXT DEFAULT '',
    uploader_id INTEGER REFERENCES users(id),
    category TEXT DEFAULT '',
    status TEXT CHECK(status IN ('Live','Processing','Archived')) DEFAULT 'Live',
    views INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    featured INTEGER DEFAULT 0,
    verified INTEGER DEFAULT 0,
    thumbnail TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS chat_channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    type TEXT CHECK(type IN ('channel','dm')) DEFAULT 'channel',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS chat_channel_members (
    channel_id INTEGER REFERENCES chat_channels(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (channel_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id INTEGER REFERENCES chat_channels(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id),
    text TEXT NOT NULL,
    attachment_json TEXT DEFAULT NULL,
    pinned INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled',
    content TEXT DEFAULT '',
    category TEXT DEFAULT 'General',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS moderation_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    reason TEXT NOT NULL,
    details TEXT DEFAULT '',
    status TEXT CHECK(status IN ('Pending','Approved','Rejected')) DEFAULT 'Pending',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'light',
    two_factor INTEGER DEFAULT 1,
    notify_resources INTEGER DEFAULT 1,
    notify_mentions INTEGER DEFAULT 1,
    notify_updates INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    course TEXT DEFAULT '',
    due_date TEXT NOT NULL,
    max_points INTEGER DEFAULT 100,
    created_by INTEGER REFERENCES users(id),
    status TEXT CHECK(status IN ('Active','Closed','Draft')) DEFAULT 'Active',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id),
    file_path TEXT DEFAULT '',
    comment TEXT DEFAULT '',
    grade INTEGER DEFAULT NULL,
    feedback TEXT DEFAULT '',
    graded_by INTEGER REFERENCES users(id),
    submitted_at TEXT DEFAULT (datetime('now')),
    graded_at TEXT DEFAULT NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type TEXT CHECK(type IN ('info','success','warning','assignment','grade','chat','resource')) DEFAULT 'info',
    title TEXT NOT NULL,
    body TEXT DEFAULT '',
    link TEXT DEFAULT '',
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    target_type TEXT DEFAULT '',
    target_id INTEGER DEFAULT NULL,
    details TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

export default db;
