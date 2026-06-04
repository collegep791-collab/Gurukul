# 🎓 Gurukul — Modern Scholar Platform

<div align="center">

**A comprehensive educational collaboration and academic resource management platform for modern scholars.**

Built with **React 19** · **Express.js 5** · **Supabase** · **Tailwind CSS** · **JWT Auth**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## 📑 Table of Contents

- [Tech Stack](#-tech-stack)
- [Architecture Overview](#-architecture-overview)
- [Core Features](#-core-features)
- [Prerequisites](#-prerequisites)
- [Installation Guide](#-installation-guide)
- [Supabase Setup](#-supabase-setup)
- [Environment Configuration](#-environment-configuration)
- [Running Locally](#-running-locally)
- [Demo Credentials](#-demo-credentials)
- [Project Structure](#-project-structure)
- [File Documentation Index](#-file-documentation-index)
- [NPM Dependencies Explained](#-npm-dependencies-explained)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Deployment (Vercel)](#-deployment-vercel)
- [Troubleshooting](#-troubleshooting)

---

## 🌟 Tech Stack

| Layer | Technologies | Description |
| --- | --- | --- |
| **Frontend** | React 19, Vite 8, Tailwind CSS (CDN), React Router 7, Material Symbols | Fast, reactive SPA with glassmorphism aesthetics, responsive design, and dark mode. |
| **Backend** | Express.js 5, Multer, Helmet, express-rate-limit | Stateless REST API with robust security middleware stack. |
| **Database & Realtime** | Supabase (PostgreSQL + WebSockets) | Managed relational database with real-time message broadcasting, typing indicators, and notification events. |
| **Storage** | Supabase Storage Buckets | Secure object storage with CDN distribution for resources, avatars, and assignment submissions. |
| **Authentication** | JWT (jsonwebtoken) + bcryptjs + HttpOnly Cookies | Stateless, XSS-resistant session management with HS256 signed tokens. |
| **Deployment** | Vercel (Serverless + Static CDN) | Zero-config deployment with serverless API functions and global CDN for static assets. |

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                          │
│                                                             │
│   React 19 SPA ──── REST API (/api/*) ──── Express.js :3001│
│   (Vite :5173)      HttpOnly Cookie         Middleware:     │
│                     credentials:include     Helmet, CORS,   │
│                                             Rate Limit, JWT │
│   Supabase Client ─── WebSocket ─── Supabase Realtime      │
│   (ANON key)          postgres_changes      Engine          │
│                       broadcast                             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  SUPABASE CLOUD                             │
│                                                             │
│   PostgreSQL DB ──── Realtime Engine ──── Storage Buckets   │
│   (12+ tables)       (WebSockets)         (resources,       │
│   RLS enabled        INSERT/UPDATE         avatars,         │
│                      broadcast             assignments)     │
└─────────────────────────────────────────────────────────────┘
```

**Key Design Decisions:**
- **Dual Supabase clients**: Server uses `SERVICE_ROLE_KEY` (bypasses RLS), frontend uses `ANON_KEY` (only for Realtime subscriptions).
- **JWT in HttpOnly cookies**: Prevents XSS token theft. The `Secure` flag and `SameSite: lax` prevent CSRF.
- **Vite proxy in development**: `/api/*` requests are proxied from `:5173` → `:3001` to avoid CORS during development.
- **DataContext as singleton state**: All API calls and Supabase Realtime subscriptions are centralized in one React Context provider.

---

## ⚡ Core Features

| Feature | Description | Key Files |
| --- | --- | --- |
| 📂 **Resource Hub** | Upload, catalog, search, and discover academic files (Documents, Videos, Audios, Images). Independent view/download tracking. | `server/routes/resources.js`, `src/pages/ResourceHub.jsx` |
| 📝 **Scholarly Notes** | Markdown-rich personal study notes with auto-save (1.5s debounce). Teachers can broadcast global notes. | `server/routes/notes.js`, `src/pages/Notes.jsx` |
| 💬 **Real-time Chat** | Channel-based chat with Supabase Realtime WebSockets, typing indicators, DM support, pinned messages. | `server/routes/chat.js`, `src/pages/Chat.jsx` |
| 🎯 **Assignments Board** | Role-specific assignment creation, file submission, grading with feedback, and credit rewards. | `server/routes/assignments.js`, `src/pages/Assignments.jsx` |
| 🛡️ **Admin Portal (Atheneum)** | System metrics, moderation queue, audit logging, user management, resource oversight. | `server/index.js`, `src/pages/AdminDashboard.jsx` |
| ⏰ **Gamified Streaks** | Daily engagement tracking with streak counters and credit rewards (`base(10) + streak × 5`). | `server/routes/streaks.js` |
| 🌓 **Dark/Light Theme** | Persistent theme with flash prevention (pre-React script in HTML), synced to localStorage and server. | `src/context/ThemeContext.jsx`, `index.html` |
| 🔔 **Notification Center** | Real-time notifications with unread badges, mark-read, and mark-all-read functionality. | `server/routes/notifications.js`, `src/components/TopNav.jsx` |
| 👥 **User Management** | Admin user creation, role changes, account suspension/reactivation with notifications. | `server/routes/users.js`, `src/pages/Users.jsx` |
| 🔐 **Google OAuth** | One-click Google Sign-In with server-side token verification and auto-provisioning. | `server/routes/auth.js`, `src/pages/Login.jsx` |

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Verify Command | Installation |
| --- | --- | --- | --- |
| **Node.js** | v18.0.0 or higher | `node --version` | [nodejs.org](https://nodejs.org/) |
| **npm** | v9.0.0 or higher | `npm --version` | Comes with Node.js |
| **Git** | Any recent version | `git --version` | [git-scm.com](https://git-scm.com/) |
| **A Supabase account** | Free tier works | — | [supabase.com](https://supabase.com/) |

> **Note**: This project uses ES Modules (`"type": "module"` in package.json) and the `--env-file` Node.js flag, which requires Node.js 18+.

---

## 📥 Installation Guide

### Step 1: Clone the Repository

```bash
# Clone via HTTPS
git clone https://github.com/collegep791-collab/Gurukul.git

# Or clone via SSH
git clone git@github.com:collegep791-collab/Gurukul.git

# Navigate into the project directory
cd Gurukul
```

### Step 2: Install All Dependencies

```bash
# Install both production and development dependencies
npm install
```

This will install **all 16 production dependencies and 7 dev dependencies** listed in `package.json`. See the [NPM Dependencies Explained](#-npm-dependencies-explained) section for details on what each one does.

### Step 3: Verify Installation

```bash
# Check that all dependencies are installed correctly
npm ls --depth=0

# Verify the build works (optional but recommended)
npm run build
```

If `npm install` fails, try:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## 🗄 Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com/) and sign in
2. Click **"New Project"**
3. Choose a name (e.g., `gurukul`), set a database password, and select a region
4. Wait for the project to provision (~2 minutes)

### 2. Create the Database Tables

Go to **SQL Editor** in your Supabase dashboard and run the following SQL to create all required tables:

```sql
-- ============================================================
-- GURUKUL DATABASE SCHEMA
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- Users table (core identity)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar TEXT DEFAULT 'https://api.dicebear.com/7.x/initials/svg?seed=User',
  role TEXT CHECK (role IN ('ADMIN', 'TEACHER', 'STUDENT')) DEFAULT 'STUDENT',
  status TEXT DEFAULT 'Active',
  credits INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0,
  usn TEXT,
  class TEXT,
  section TEXT,
  date_joined TEXT DEFAULT TO_CHAR(NOW(), 'Mon DD, YYYY'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings (preferences)
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light',
  two_factor INTEGER DEFAULT 1,
  notify_resources INTEGER DEFAULT 1,
  notify_mentions INTEGER DEFAULT 1,
  notify_updates INTEGER DEFAULT 0
);

-- User activity (streak tracking)
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT,
  credits_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resources (academic files)
CREATE TABLE IF NOT EXISTS resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('Document', 'Video', 'Audio', 'Image')),
  format TEXT,
  size TEXT,
  file_path TEXT,
  uploader_id UUID REFERENCES users(id) ON DELETE SET NULL,
  category TEXT,
  status TEXT DEFAULT 'Pending',
  thumbnail TEXT,
  views INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat channels
CREATE TABLE IF NOT EXISTS chat_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'channel',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat channel members
CREATE TABLE IF NOT EXISTS chat_channel_members (
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (channel_id, user_id)
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  attachment_json JSONB,
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  course TEXT,
  due_date TIMESTAMPTZ,
  max_points INTEGER DEFAULT 100,
  status TEXT DEFAULT 'Active',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submissions
CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  file_path TEXT,
  comment TEXT,
  grade INTEGER,
  feedback TEXT,
  graded_by UUID REFERENCES users(id),
  graded_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

-- Notes
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Untitled',
  content TEXT DEFAULT '',
  category TEXT DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'info',
  title TEXT,
  body TEXT,
  link TEXT,
  read INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moderation queue
CREATE TABLE IF NOT EXISTS moderation_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  reason TEXT,
  details TEXT,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES users(id),
  action TEXT,
  target_type TEXT,
  target_id TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Create Storage Buckets

Go to **Storage** in Supabase dashboard and create 3 buckets:

| Bucket Name | Public | Purpose |
| --- | --- | --- |
| `resources` | ✅ Yes | Academic resources (PDFs, videos, images) |
| `avatars` | ✅ Yes | User profile pictures |
| `assignments` | ✅ Yes | Student assignment submissions |

For each bucket, set it to **Public** so files can be accessed via direct URLs.

### 4. Enable Realtime

Go to **Database → Replication** and enable the following tables for Realtime:
- `chat_messages` (for live chat)
- `notifications` (for real-time notification badges)

### 5. Get Your API Keys

Go to **Settings → API** in your Supabase dashboard and note down:
- **Project URL**: `https://your-project-id.supabase.co`
- **anon (public) key**: Used by the frontend for Realtime subscriptions
- **service_role (secret) key**: Used by the backend to bypass RLS (⚠️ keep this secret!)

---

## ⚙️ Environment Configuration

### Step 1: Copy the Template

```bash
cp .env.example .env
```

### Step 2: Fill In Your Values

Open `.env` in your editor and configure each variable:

```env
# ─── Server Configuration ───────────────────────────────────
PORT=3001
SESSION_SECRET=your-secure-random-secret-here
NODE_ENV=development

# ─── Supabase (Server-Side — used by Express.js) ────────────
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...your-service-role-key...

# ─── Supabase (Client-Side — used by React via Vite) ────────
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-key...

# ─── Frontend URL (for CORS) ────────────────────────────────
FRONTEND_URL=http://localhost:5173

# ─── Google OAuth (Optional) ────────────────────────────────
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Generate a Secure JWT Secret

```bash
# Run this in your terminal to generate a cryptographically secure secret:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and paste it as `SESSION_SECRET` in your `.env` file.

> **⚠️ IMPORTANT:** The `SUPABASE_SERVICE_ROLE_KEY` has full admin access to your database. **Never** commit it to Git or expose it in the frontend. Only the `VITE_*` prefixed variables are accessible in the browser.

---

## 🚀 Running Locally

### Option A: Start Everything at Once (Recommended)

```bash
# Starts both Express.js backend (:3001) and Vite frontend (:5173) concurrently
npm run dev:all
```

### Option B: Start Backend and Frontend Separately

**Terminal 1 — Backend API server:**
```bash
npm run server
```

**Terminal 2 — Frontend dev server:**
```bash
npx vite
```

### Step 3: Seed the Database (First Run Only)

The seed script runs automatically when the server starts. It creates 3 demo accounts and the "Campus Hub" chat channel. If the database already has users, it skips seeding.

To manually re-seed:
```bash
node --env-file=.env server/seed.js
```

### Step 4: Open in Browser

```
http://localhost:5173
```

You should see the Gurukul login page. Use any of the [demo credentials](#-demo-credentials) below to log in.

### Available NPM Scripts

| Script | Command | Description |
| --- | --- | --- |
| `dev` | `npm run dev` | Start backend + frontend concurrently |
| `dev:all` | `npm run dev:all` | Same as `dev` (alias) |
| `server` | `npm run server` | Start only the Express.js backend |
| `build` | `npm run build` | Build production frontend bundle (outputs to `dist/`) |
| `start` | `npm start` | Start production server (uses built frontend) |
| `lint` | `npm run lint` | Run ESLint across all files |
| `preview` | `npm run preview` | Preview the production build locally |

---

## 🔑 Demo Credentials

After seeding, use these accounts to log in:

| Role | Email | Password | Dashboard |
| --- | --- | --- | --- |
| **System Admin** | `admin@gurukul.edu` | `password123` | `/admin/dashboard` — Full system control |
| **Teacher** | `teacher@gurukul.edu` | `password123` | `/teacher/dashboard` — Course & assignment management |
| **Student** | `student@gurukul.edu` | `password123` | `/student/dashboard` — Learning portal |

> **Note:** When logging in, select the matching **role** radio button on the login form. The server validates that the selected role matches the user's actual role in the database.

---

## 📦 Project Structure

```
Gurukul/
├── server/                          # ─── Backend REST API Server ───
│   ├── index.js                     # Express entry point, middleware stack, route mounting
│   ├── jwt.js                       # JWT sign/verify/cookie management (HS256, HttpOnly)
│   ├── supabase.js                  # Server-side Supabase client (SERVICE_ROLE_KEY)
│   ├── seed.js                      # Idempotent database seeder (3 users + Campus Hub)
│   └── routes/                      # API Route Handlers
│       ├── auth.js                  # Login, Register, Google OAuth, /me, Logout
│       ├── resources.js             # Resource CRUD + Multer file upload to Supabase Storage
│       ├── chat.js                  # Channels, Messages, DMs, Pinned messages
│       ├── assignments.js           # Assignment CRUD, Submissions, Grading with credits
│       ├── streaks.js               # Daily check-in, streak calculation, credit rewards
│       ├── notes.js                 # Personal + Global notes CRUD
│       ├── users.js                 # User management, avatar upload, password change
│       ├── notifications.js         # Notification CRUD, unread count, mark-read
│       ├── settings.js              # User preferences (theme, notifications, 2FA)
│       └── audit.js                 # Admin-only audit log viewer
│
├── src/                             # ─── React Frontend Client ───
│   ├── main.jsx                     # React entry point (mounts to #root)
│   ├── App.jsx                      # Root router with AuthGuard + Context providers
│   ├── index.css                    # Global CSS with custom animations
│   ├── context/                     # Global State Managers
│   │   ├── DataContext.jsx          # Singleton state: user, resources, messages, API calls
│   │   └── ThemeContext.jsx         # Dark/light mode with localStorage + server sync
│   ├── lib/                         # Client Utilities
│   │   ├── api.js                   # HTTP fetch wrapper with 401 interception
│   │   ├── supabase.js              # Frontend Supabase client (ANON_KEY, Realtime only)
│   │   └── dateUtils.js             # UTC → local timezone conversion helper
│   ├── components/                  # Reusable UI Components
│   │   ├── DashboardLayout.jsx      # Shell layout (Sidebar + TopNav + BottomNav + ambient bg)
│   │   ├── Sidebar.jsx              # Desktop sidebar with role-filtered navigation
│   │   ├── TopNav.jsx               # Top bar with search, notifications, dark mode, logout
│   │   ├── BottomNav.jsx            # Mobile bottom navigation bar
│   │   ├── ConfirmDialog.jsx        # Reusable confirmation modal (danger/primary variants)
│   │   ├── UploadModal.jsx          # Resource upload modal (file + URL modes)
│   │   └── ErrorBoundary.jsx        # React error boundary with fallback UI
│   └── pages/                       # Route Pages
│       ├── Login.jsx                # Auth UI (login/register tabs + Google Sign-In)
│       ├── AdminDashboard.jsx       # Admin portal (metrics, moderation, resource registry)
│       ├── StudentDashboard.jsx     # Student portal (assignments, streaks, materials)
│       ├── TeacherDashboard.jsx     # Teacher portal (courses, submissions, roster)
│       ├── ResourceHub.jsx          # Resource library with filters, search, featured card
│       ├── Chat.jsx                 # Real-time chat with channels, DMs, typing indicators
│       ├── Notes.jsx                # Markdown note editor with auto-save
│       ├── Assignments.jsx          # Assignment board (create/submit/grade)
│       ├── Users.jsx                # User management table (admin)
│       ├── Settings.jsx             # Profile, security, notifications, preferences
│       ├── AuditLogs.jsx            # Audit trail viewer (admin)
│       └── NotFound.jsx             # 404 error page
│
├── index.html                       # HTML shell (Tailwind CDN, Material Symbols, dark mode script)
├── vite.config.js                   # Vite config (proxy /api → :3001, React plugin)
├── vercel.json                      # Vercel deployment config (serverless + static routing)
├── eslint.config.js                 # ESLint config (React hooks + refresh plugins)
├── package.json                     # Dependencies and scripts
├── check_rls.js                     # Diagnostic script for Supabase RLS policies
├── .env.example                     # Environment variable template
└── .gitignore                       # Git ignore rules
```

---

## 📄 File Documentation Index

Every source file in this project includes a **JSDoc comment header** at the top of the file that documents:
- **File path** within the project
- **Technical Component** name  
- **Description** of what the file does
- **Dependencies** it relies on
- **Demo Notes** where applicable

Example from `src/lib/api.js`:
```javascript
/**
 * src/lib/api.js
 * 
 * Technical Component: HTTP Fetch API Wrapper
 * Description: A centralized utility for making REST API calls to the backend.
 * It enforces strict `credentials: 'include'` on every request to ensure the HttpOnly
 * JWT cookie is sent along. It also centralizes error handling, automatically intercepting
 * 401 Unauthorized responses to force a secure logout/redirect back to the login screen.
 */
```

### Backend Files Summary

| File | Technical Component | What It Does |
| --- | --- | --- |
| `server/index.js` | Express Server Entry | Configures middleware (Helmet, CORS, Rate Limiter, JWT), mounts all API routes, attaches audit/notification helpers to `app.locals`, exports for Vercel |
| `server/jwt.js` | JWT Authentication Module | Signs tokens (HS256, 24h expiry), verifies tokens from cookies, sets/clears HttpOnly cookies with Secure/SameSite flags |
| `server/supabase.js` | Server Supabase Client | Creates the Supabase client using `SERVICE_ROLE_KEY` to bypass Row Level Security for all server operations |
| `server/seed.js` | Database Seeder | Idempotently creates 3 demo users (admin/teacher/student), the Campus Hub channel, and default user settings |
| `server/routes/auth.js` | Authentication API | Handles login (role validation), registration (USN format check), Google OAuth (token verification), session check (`/me`), and logout |
| `server/routes/resources.js` | Resource CRUD API | Multer file upload (50MB limit, type whitelist) → Supabase Storage, independent view/download counters, admin/teacher deletion |
| `server/routes/chat.js` | Chat API | Channel CRUD, message pagination (cursor-based), DM deduplication, pinned messages, member management |
| `server/routes/assignments.js` | Assignment API | RBAC-enforced assignment creation, file submission, grading with credit rewards and notifications, cascade delete |
| `server/routes/streaks.js` | Gamification Engine | Daily check-in with yesterday comparison, streak formula: `base(10) + streak × 5`, 7-day activity history |
| `server/routes/notes.js` | Notes API | Personal note CRUD + global teacher/admin note broadcasting, sorted by `updated_at` |
| `server/routes/users.js` | User Management API | Admin-only user CRUD, avatar upload, password change (bcrypt verify), suspend/activate with notifications |
| `server/routes/notifications.js` | Notification API | Paginated notifications (unread first), unread count, mark-read, mark-all-read |
| `server/routes/settings.js` | Settings API | User preference CRUD (theme, 2FA, notification toggles) with upsert on conflict |
| `server/routes/audit.js` | Audit Log API | Admin-only paginated audit log with actor details (name, avatar) via Supabase foreign key joins |

### Frontend Files Summary

| File | Technical Component | What It Does |
| --- | --- | --- |
| `src/main.jsx` | React Entry Point | Bootstraps React and mounts `<App />` into the DOM's `#root` element |
| `src/App.jsx` | Main Router | Defines all client-side routes, wraps protected routes with `<AuthGuard>`, provides Context providers (Theme → Data → Router) |
| `src/context/DataContext.jsx` | Global State Manager | Centralized state for user, resources, messages, notifications. All API calls via `useCallback`. Manages Supabase Realtime subscriptions for chat and typing |
| `src/context/ThemeContext.jsx` | Theme Manager | Dark/light mode with localStorage persistence (prevents flash), syncs preference to server via Settings API |
| `src/lib/api.js` | HTTP Wrapper | Centralized `fetch` with `credentials: 'include'`, 401 interceptor with auto-redirect, separate `upload()` for FormData |
| `src/lib/supabase.js` | Frontend Realtime Client | Supabase client using `ANON_KEY` — only used for Realtime WebSocket subscriptions (not data mutations) |
| `src/lib/dateUtils.js` | Date Utilities | Converts Supabase UTC timestamps (missing 'Z' suffix) to correct local time |
| `src/components/DashboardLayout.jsx` | Shell Layout | Renders ambient background, Sidebar, TopNav, BottomNav, and main content area |
| `src/components/Sidebar.jsx` | Desktop Navigation | Role-filtered nav items with dynamic route mapping (teacher → `/teacher/dashboard`) |
| `src/components/TopNav.jsx` | Top Navigation Bar | Global search, notification dropdown with unread badges, dark mode toggle, user avatar menu, logout |
| `src/components/BottomNav.jsx` | Mobile Navigation | Fixed bottom nav for mobile with role-adaptive dashboard routing and iOS safe-area support |
| `src/components/ConfirmDialog.jsx` | Confirmation Modal | Controlled modal for destructive actions (delete, suspend) with danger/primary variants |
| `src/components/UploadModal.jsx` | Upload Interface | Dual-mode upload (file upload or URL mapping) for contributing resources |
| `src/components/ErrorBoundary.jsx` | Error Boundary | React class component that catches rendering errors and shows a fallback UI |
| `src/pages/Login.jsx` | Auth UI | Tab-based login/register with role selection, Google Sign-In SDK integration, form validation |
| `src/pages/AdminDashboard.jsx` | Admin Portal | Metric cards, engagement chart, resource registry table, moderation queue |
| `src/pages/StudentDashboard.jsx` | Student Portal | Assignment overview (pending/overdue/graded), course progress bars, materials, notes, quick chat |
| `src/pages/TeacherDashboard.jsx` | Teacher Portal | Teaching stats, active assignments, recent resources, student roster, quick actions |
| `src/pages/ResourceHub.jsx` | Resource Library | Featured card, type filter tabs, search, category sidebar, skeleton loaders, upload modal |
| `src/pages/Chat.jsx` | Chat Interface | Channel sidebar, message feed with auto-scroll, typing indicators, DM creation, channel info panel |
| `src/pages/Notes.jsx` | Note Editor | Split-pane (list + editor), auto-save with 1.5s debounce, Markdown preview via react-markdown |
| `src/pages/Assignments.jsx` | Assignment Board | Active/past tabs, create form (teacher), submit form (student), grading panel (teacher) |
| `src/pages/Users.jsx` | User Management | Filterable table, role change dropdown, suspend/reactivate, create user modal, pagination |
| `src/pages/Settings.jsx` | User Settings | Profile edit, avatar upload, password change, notification toggles, theme preference |
| `src/pages/AuditLogs.jsx` | Audit Trail | Admin-only table of system events with actor details, action badges, and timestamps |
| `src/pages/NotFound.jsx` | 404 Page | Styled error page with ambient backgrounds and navigation button |

---

## 📦 NPM Dependencies Explained

### Production Dependencies

| Package | Version | Purpose |
| --- | --- | --- |
| `@supabase/supabase-js` | ^2.105.4 | Supabase JavaScript client for database queries, storage operations, and Realtime WebSocket subscriptions |
| `@vercel/analytics` | ^2.0.1 | Vercel Web Analytics for tracking page views and user interactions in production |
| `bcryptjs` | ^3.0.3 | Password hashing library — generates salted hashes (10 rounds) for secure password storage and comparison |
| `cookie-parser` | ^1.4.7 | Express middleware to parse `Cookie` headers into `req.cookies` object (reads JWT from `gk_token` cookie) |
| `cors` | ^2.8.6 | Express middleware for Cross-Origin Resource Sharing — allows frontend (`:5173`) to call backend (`:3001`) |
| `express` | ^5.2.1 | Node.js web framework — handles routing, middleware chain, and HTTP request/response processing |
| `express-rate-limit` | ^8.3.2 | Rate limiting middleware — global limit (1000 req/15min) and auth-specific limit (30 req/15min) to prevent abuse |
| `helmet` | ^8.1.0 | Security headers middleware — sets `X-Content-Type-Options`, `X-Frame-Options`, `HSTS`, and more |
| `jsonwebtoken` | ^9.0.3 | JWT library for signing (HS256) and verifying authentication tokens with 24-hour expiry |
| `lucide-react` | ^1.7.0 | React icon library (available but Material Symbols are primarily used via Google Fonts CDN) |
| `multer` | 1.4.4-lts.1 | File upload middleware for Express — handles `multipart/form-data` with memory storage (no disk writes) |
| `react` | ^19.2.4 | React 19 core library for building the component-based UI with hooks and concurrent rendering |
| `react-dom` | ^19.2.4 | React DOM renderer — handles mounting React components to the browser DOM |
| `react-markdown` | ^10.1.0 | Markdown-to-React renderer — used in the Notes page for live Markdown preview |
| `react-router-dom` | ^7.14.0 | Client-side routing library — handles SPA navigation, route guards, and URL management |
| `recharts` | ^3.8.1 | React charting library — used for the engagement bar chart on the Admin Dashboard |

### Development Dependencies

| Package | Version | Purpose |
| --- | --- | --- |
| `@eslint/js` | ^9.39.4 | ESLint core JavaScript configuration |
| `@types/react` | ^19.2.14 | TypeScript type definitions for React (enables IDE intellisense even without TypeScript) |
| `@types/react-dom` | ^19.2.3 | TypeScript type definitions for React DOM |
| `@vitejs/plugin-react` | ^6.0.1 | Vite plugin that enables React Fast Refresh (HMR) and JSX transformation |
| `eslint` | ^9.39.4 | JavaScript/JSX linter for code quality and consistency |
| `eslint-plugin-react-hooks` | ^7.0.1 | ESLint rules for React Hooks (warns about missing dependencies, wrong hook order) |
| `eslint-plugin-react-refresh` | ^0.5.2 | ESLint plugin ensuring components are compatible with React Fast Refresh |
| `globals` | ^17.4.0 | Provides global variable definitions for ESLint (browser, node, etc.) |
| `vite` | ^8.0.4 | Next-generation frontend build tool — lightning-fast dev server with HMR and optimized production builds |

---

## 🔌 API Endpoints Reference

### Authentication (`/api/auth/`)
| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Login with email, password, and role |
| `POST` | `/api/auth/register` | Register new student account |
| `POST` | `/api/auth/google` | Google OAuth sign-in |
| `POST` | `/api/auth/logout` | Clear auth cookie |
| `GET` | `/api/auth/me` | Get current authenticated user |

### Resources (`/api/resources/`)
| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/resources` | List all resources (filterable by type, search) |
| `GET` | `/api/resources/:id` | Get resource details (increments views) |
| `GET` | `/api/resources/:id/download` | Track download (increments downloads) |
| `POST` | `/api/resources` | Upload new resource (multipart/form-data) |
| `DELETE` | `/api/resources/:id` | Delete resource (admin/teacher/owner) |

### Chat (`/api/chat/`)
| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/chat/channels` | List user's channels |
| `POST` | `/api/chat/channels` | Create a new channel |
| `GET` | `/api/chat/channels/:id/messages` | Get channel messages (paginated) |
| `POST` | `/api/chat/channels/:id/messages` | Send a message |
| `POST` | `/api/chat/dm` | Create or get DM channel |

### Assignments (`/api/assignments/`)
| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/assignments` | List assignments |
| `POST` | `/api/assignments` | Create assignment (teacher/admin) |
| `POST` | `/api/assignments/:id/submit` | Submit assignment (student) |
| `POST` | `/api/assignments/:id/grade/:subId` | Grade submission (teacher/admin) |
| `DELETE` | `/api/assignments/:id` | Delete assignment with cascade |

---

## 🌐 Deployment (Vercel)

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com/) and import your GitHub repository
2. Vercel auto-detects the framework settings from `vercel.json`
3. Add your environment variables in **Settings → Environment Variables**:
   - `SESSION_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GOOGLE_CLIENT_ID` (optional)
4. Click **Deploy**

The `vercel.json` routes:
- `/api/*` → Serverless Function (`server/index.js`)
- Static files → CDN
- Everything else → `index.html` (SPA fallback)

---

## 🔧 Troubleshooting

| Issue | Cause | Fix |
| --- | --- | --- |
| **`Cannot find module`** after clone | Dependencies not installed | Run `npm install` |
| **`--env-file` not recognized** | Node.js version < 18 | Upgrade to Node.js 18+ |
| **White screen after login** | Missing Supabase URL/key | Check `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| **401 on every API call** | JWT cookie not being sent | Ensure Vite proxy is configured in `vite.config.js` |
| **"SUPABASE_URL not set" warning** | Missing server env vars | Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `.env` |
| **CORS error in console** | Backend not running or wrong port | Start backend with `npm run server` on port 3001 |
| **Files won't upload** | Storage buckets don't exist | Create `resources`, `avatars`, `assignments` buckets in Supabase |
| **Chat not updating in real-time** | Realtime not enabled | Enable Realtime replication for `chat_messages` table in Supabase |
| **Dark mode flashes white** | Pre-React script missing | Check `index.html` has the dark mode script before `<div id="root">` |
| **Rate limit hit during testing** | Too many login attempts | Wait 15 minutes or restart the server |
| **`npm run build` fails** | ESLint errors or missing deps | Run `npm run lint` to find errors, then `npm install` |
| **Google Sign-In not working** | Missing Client ID | Set `VITE_GOOGLE_CLIENT_ID` in `.env` |
| **Seed not creating users** | Database already has data | Seed is idempotent — clear `users` table first if you want to re-seed |

---

## 📄 License

This project is for academic/educational purposes.

---

<div align="center">
  <sub>Built for the academic community</sub>
</div>
