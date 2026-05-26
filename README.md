# Gurukul — Modern Scholar Platform

Gurukul is a high-fidelity, comprehensive educational collaboration and academic resource management platform designed for modern scholars. 

Built on a modern stack featuring **React 19**, **Express.js**, **Supabase (PostgreSQL, Realtime, Storage)**, and styled beautifully using **Tailwind CSS**, Gurukul facilitates real-time interaction, structured assignments, collaborative chats, and dynamic academic discovery.

---

## 🌟 Tech Stack

| Layer | Technologies | Description |
| --- | --- | --- |
| **Frontend** | React 19, Vite, Tailwind CSS, React Router | Fast, reactive, responsive interface featuring ambient glassmorphism aesthetics and clean dark mode. |
| **Backend** | Express.js | Secure REST API endpoints with robust error handling and 401 interception. |
| **Database & Realtime** | Supabase (PostgreSQL, WebSockets) | Handles structural queries, real-time message broadcasting, typing indicators, and notification events. |
| **Storage** | Supabase Storage Buckets | Secure storage and CDN distribution for academic resources and student assignment submissions. |
| **Authentication** | JWT via HttpOnly Cookies | Stateless, highly-secure session management preventing XSS/CSRF vector compromises. |

---

## ⚡ Core Features

- 📂 **Resource Hub**: Upload, catalog, search, and discover academic files (Documents, Videos, Audios, Images). Track exact views and downloads independently with an optimized state.
- 📝 **Scholarly Notes**: Markdown-rich, personal study note-taking tool that enables students to structure their learning.
- 💬 **Collaborative Chat**: Persistent, channel-based chat rooms equipped with real-time Supabase WebSockets, typing indicators, and timezone-aware local timestamp conversion.
- 🎯 **Assignments Board**: Role-specific assignment creation, submission pipelines with document uploads, and grading logs for Teachers/Admins.
- 🛡️ **Atheneum (Admin Portal)**: High-level metrics view, pending moderation queues, activity audit logging, and direct user management.
- ⏰ **Gamified Streaks**: Daily engagement trackers with streak counters and credit systems rewarding consistent scholars.
- 🌓 **Dynamic Theme Engine**: Smooth, persistent system-wide light/dark mode syncing preferences to both database profiles and `localStorage`.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v18+)
- A **Supabase** project (configured table schema & storage buckets)

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the root directory:
```env
PORT=3001
JWT_SECRET=your-secure-jwt-secret-key

# Supabase API Settings
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Install & Bootstrap
```bash
# Install dependencies
npm install

# Seed the Supabase database with initial mock accounts & settings
npm run seed
```

### 4. Running Locally

Start the entire environment simultaneously (API server + Vite client development server) using:
```bash
npm run dev:all
```
- Frontend will be served at: **http://localhost:5173**
- Backend API will be served at: **http://localhost:3001**

---

## 📦 Project Structure

```
Gurukul/
├── server/                 # Backend REST API Server
│   ├── index.js            # Server entrypoint & static mounting
│   ├── jwt.js              # Token signing, extraction, & validation
│   ├── supabase.js         # Supabase Server SDK Client initialization
│   ├── seed.js             # Initial db seeder script
│   └── routes/             # API Route Handlers
│       ├── auth.js         # User registration & cookie-session login
│       ├── resources.js    # Resource downloads, views, & uploads
│       ├── chat.js         # Channel queries & chat logs
│       ├── assignments.js  # Coursework submissions & grading routes
│       └── settings.js     # User preferences & customization sync
├── src/                    # React Frontend client
│   ├── components/         # Reusable Shell components (Sidebar, TopNav, ConfirmDialog)
│   ├── context/            # Global contexts (DataContext, ThemeContext)
│   ├── lib/                # Client utilities (api, supabase, dateUtils)
│   ├── pages/              # Portal pages (AdminDashboard, StudentDashboard, Chat, Resources)
│   ├── App.jsx             # Client-side AuthGuard router
│   └── main.jsx            # Entry point mounting Tailwind CSS
├── package.json            # Dependency manifest
└── vite.config.js          # Vite build & local server configurations
```

---

## 🔑 Demo Credentials

| Role | Email | Password |
| --- | --- | --- |
| **System Admin** | `admin@gurukul.edu` | `password123` |
| **Prof. Guide (Teacher)** | `teacher@gurukul.edu` | `password123` |
| **Student One** | `student@gurukul.edu` | `password123` |
