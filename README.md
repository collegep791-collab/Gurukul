# Gurukul — Modern Scholar Platform

A full-stack academic resource management and collaboration platform built with **React**, **Express.js**, **SQLite**, and **WebSockets**.

## Quick Start

### Development (Two Terminals)

```bash
# Terminal 1: API Server
npm run server

# Terminal 2: Frontend
npm run dev
```

Or start both simultaneously:
```bash
npm run dev:all
```

Then open **http://localhost:5173**

### Docker (Production)

```bash
docker compose up --build
```

Then open **http://localhost:3001**

## Demo Credentials

| Role    | Email              | Password      |
| ------- | ------------------ | ------------- |
| Student | aryan@gurukul.edu  | password123   |
| Admin   | elena@gurukul.edu  | password123   |
| Teacher | sarah@gurukul.edu  | password123   |

## Features

- **Real-time Chat** — WebSocket-powered channels and direct messages
- **Resource Hub** — Upload, search, and filter academic resources
- **Scholarly Notes** — Markdown-powered note-taking with auto-save
- **Dark Mode** — Persistent theme toggle stored in database + localStorage
- **Admin Dashboard** — Metrics, moderation queue, resource management
- **Role-based Access** — Admin, Teacher, and Student views

## Tech Stack

| Layer      | Technology                       |
| ---------- | -------------------------------- |
| Frontend   | React 19, Vite, Tailwind CSS    |
| Backend    | Express.js, WebSocket (`ws`)     |
| Database   | SQLite via `better-sqlite3`      |
| Auth       | `express-session` + `bcryptjs`   |
| Deployment | Docker + Docker Compose          |

## Project Structure

```
Gurukul/
├── server/                 # Backend API
│   ├── index.js            # Express + WebSocket server
│   ├── db.js               # SQLite schema
│   ├── seed.js             # Database seeding
│   └── routes/             # REST API endpoints
│       ├── auth.js
│       ├── chat.js
│       ├── notes.js
│       ├── resources.js
│       ├── settings.js
│       └── users.js
├── src/                    # React frontend
│   ├── components/         # Shared UI components
│   ├── context/            # DataContext + ThemeContext
│   ├── lib/                # API wrapper
│   └── pages/              # Page components
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Environment Variables

Copy `.env.example` to `.env` and update:

```
PORT=3001
SESSION_SECRET=your-secret
NODE_ENV=production
```
