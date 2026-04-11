# Gurukul — Production Readiness Plan

Deliver registration with Google Sign-In, mobile-first responsive UI, live production URL, 60–100 student capacity, and a fully working streak + credits system.

---

## User Review Required

> [!IMPORTANT]
> **Google Sign-In requires a Google Cloud Console project.** You'll need to create OAuth 2.0 credentials at [console.cloud.google.com](https://console.cloud.google.com). I'll generate the code so you just need to paste in the Client ID. **No billing required** — the free tier covers this.

> [!IMPORTANT]
> **Deployment platform choice: Render.com (free tier).** This gives you a live `https://gurukul-xxxx.onrender.com` URL. Alternatives are Railway or Fly.io — let me know if you have a preference. Render is the easiest zero-config option for Node + SQLite.

> [!WARNING]
> **The current SQLite DB will be recreated on Render's free tier** if the service sleeps for 15+ mins. For a demo/testing scenario with 60-100 students this is fine — the app auto-seeds on first launch. For permanent data persistence, we'd need Render's $7/mo disk or switch to PostgreSQL (bigger change).

---

## Proposed Changes

### 1. User Registration + Google Sign-In

Currently the Login page has a disabled "Register" tab and disabled Google/Microsoft SSO buttons. We need to wire both up.

---

#### [MODIFY] [auth.js](file:///Users/staruntejas/Desktop/Gurukul/server/routes/auth.js)

Add two new endpoints:
- **`POST /api/auth/register`** — email/password registration with validation (name, email, password ≥ 6 chars). Creates user with role `STUDENT`, hashes password, returns session.
- **`POST /api/auth/google`** — receives Google `credential` JWT from the frontend, verifies it server-side using Google's token-info endpoint (no library needed — simple `fetch` to `https://oauth2.googleapis.com/tokeninfo`), creates-or-finds the user, returns session.

#### [MODIFY] [Login.jsx](file:///Users/staruntejas/Desktop/Gurukul/src/pages/Login.jsx)

- **Enable the Register tab** — toggle between Login and Register forms using local state (`mode: 'login' | 'register'`).
- **Register form** — collects Name, Email, Password, Confirm Password. Calls `POST /api/auth/register`.
- **Google Sign-In button** — inject the Google Identity Services script (`accounts.google.com/gsi/client`), render the Google button, handle the `credential` callback → call `POST /api/auth/google`.
- Remove `cursor-not-allowed` / `disabled` / `opacity-50` from the Google button.

#### [MODIFY] [DataContext.jsx](file:///Users/staruntejas/Desktop/Gurukul/src/context/DataContext.jsx)

- Add `register(name, email, password)` function that calls `POST /api/auth/register`.
- Add `googleLogin(credential)` function that calls `POST /api/auth/google`.

#### [MODIFY] [.env](file:///Users/staruntejas/Desktop/Gurukul/.env)

Add `GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com` placeholder.

---

### 2. Mobile-Compatible Responsive UI

The current layout uses `hidden md:flex` for the sidebar, so on mobile there's **no navigation at all**. We need a bottom tab bar for mobile.

---

#### [NEW] [BottomNav.jsx](file:///Users/staruntejas/Desktop/Gurukul/src/components/BottomNav.jsx)

A fixed-bottom navigation bar (visible only on `md:hidden`) with 5 key tabs: Dashboard, Resources, Chat, Assignments, More (expanding to Notes/Settings). Uses Material Symbols icons, highlights active route, glassmorphism background.

#### [MODIFY] [DashboardLayout.jsx](file:///Users/staruntejas/Desktop/Gurukul/src/components/DashboardLayout.jsx)

- Import and render `<BottomNav />`.
- Add `pb-20 md:pb-0` padding to main content area so bottom nav doesn't overlap content on mobile.
- Ensure the background blobs don't cause horizontal scroll on mobile (already has `overflow-x-hidden`).

#### [MODIFY] [TopNav.jsx](file:///Users/staruntejas/Desktop/Gurukul/src/components/TopNav.jsx)

- Make the search bar collapsible on mobile (icon-only → expand on tap).
- Adjust notification dropdown to be full-width on small screens.
- Ensure the top nav is touch-friendly (minimum 44px tap targets).

#### [MODIFY] [StudentDashboard.jsx](file:///Users/staruntejas/Desktop/Gurukul/src/pages/StudentDashboard.jsx)

- Make the header Streak/Credits cards stack vertically on small screens.
- Ensure assignment cards and progress sections are single-column on mobile.

#### Mobile adjustments to other pages

- Quick CSS tweaks across [Chat.jsx](file:///Users/staruntejas/Desktop/Gurukul/src/pages/Chat.jsx), [ResourceHub.jsx](file:///Users/staruntejas/Desktop/Gurukul/src/pages/ResourceHub.jsx), [Assignments.jsx](file:///Users/staruntejas/Desktop/Gurukul/src/pages/Assignments.jsx) for touch-friendly sizing and single-column layouts on `< md`.

---

### 3. Production Deployment (Live URL)

---

#### [MODIFY] [Dockerfile](file:///Users/staruntejas/Desktop/Gurukul/Dockerfile)

Already production-ready. Minor adjustment: add `HEALTHCHECK` for Render.

#### [MODIFY] [server/index.js](file:///Users/staruntejas/Desktop/Gurukul/server/index.js)

- Add a health-check endpoint: `GET /api/health` → `{ status: 'ok' }`.
- Ensure `CORS` origin supports the Render URL in production.
- Ensure WebSocket URL detection works on HTTPS (already does via `window.location.protocol`).

#### [MODIFY] [vite.config.js](file:///Users/staruntejas/Desktop/Gurukul/vite.config.js)

No changes needed for production — the proxy is dev-only and `npm run build` produces static files served by Express.

#### [NEW] [render.yaml](file:///Users/staruntejas/Desktop/Gurukul/render.yaml)

Render Blueprint config for one-click deploy:
```yaml
services:
  - type: web
    name: gurukul
    runtime: node
    plan: free
    buildCommand: npm ci && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: SESSION_SECRET
        generateValue: true
      - key: GOOGLE_CLIENT_ID
        sync: false
```

**Deployment steps** (manual — takes ~3 minutes):
1. Push repo to GitHub
2. Connect GitHub repo on [render.com](https://render.com)
3. Auto-deploys on push → gives you `https://gurukul-xxxx.onrender.com`

---

### 4. 60–100 Student Data Capacity

---

#### [MODIFY] [seed.js](file:///Users/staruntejas/Desktop/Gurukul/server/seed.js)

- **Scale seed data** from 10 users to **80 students + 5 teachers + 2 admins = 87 users**.
- Generate realistic Indian/international student names programmatically using name arrays.
- Each student gets randomized credits (100–2000), streak (0–30), progress (10–90).
- Seed 15–20 assignments distributed across 6 courses.
- Seed 100+ submissions so the grading/progress system has real data.
- Seed notes and chat messages proportionally.
- All passwords remain `password123` for testing.

#### [MODIFY] [db.js](file:///Users/staruntejas/Desktop/Gurukul/server/db.js)

Add performance indexes:
```sql
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
```

This ensures queries stay fast at 100+ users with hundreds of submissions.

#### [MODIFY] [load-test.yml](file:///Users/staruntejas/Desktop/Gurukul/load-test.yml)

Update the load test to use multiple different student accounts (not just Aryan) and increase concurrency to simulate 60-100 simultaneous users.

---

### 5. Working Streak & Credits System

Currently `streak` and `credits` are static values from the seed — they never change. We need real backend logic.

---

#### [MODIFY] [db.js](file:///Users/staruntejas/Desktop/Gurukul/server/db.js)

Add a new table to track daily activity:
```sql
CREATE TABLE IF NOT EXISTS user_activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'login', 'submit', 'note', 'chat', 'resource_view'
  credits_earned INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_activity_user_date ON user_activity(user_id, created_at);
```

#### [NEW] [server/routes/streaks.js](file:///Users/staruntejas/Desktop/Gurukul/server/routes/streaks.js)

New API endpoints:
- **`GET /api/streaks/me`** — Returns current user's streak count, credits balance, last 7 days activity, and today's activity status.
- **`POST /api/streaks/checkin`** — Called on login / daily first-action. Awards +10 credits for daily check-in, +5 bonus for each consecutive streak day. Updates `users.streak` and `users.credits` in real time.

**Streak logic:**
- On each login, check if the user was active yesterday (via `user_activity` table).
- If yes → increment streak.
- If no → reset streak to 1.
- Credits earned: base 10 per day + (streak_days × 5) bonus.
- Additional credit events: submit assignment (+25), upload resource (+15), create note (+5), send chat message (+2).

#### [MODIFY] [server/index.js](file:///Users/staruntejas/Desktop/Gurukul/server/index.js)

- Import and mount the new streaks router: `app.use('/api/streaks', streakRoutes)`.

#### [MODIFY] [server/routes/auth.js](file:///Users/staruntejas/Desktop/Gurukul/server/routes/auth.js)

After successful login, trigger the streak check-in logic (log activity + calculate streak).

#### [MODIFY] [server/routes/assignments.js](file:///Users/staruntejas/Desktop/Gurukul/server/routes/assignments.js)

On assignment submission, award +25 credits and log activity.

#### [MODIFY] [server/routes/notes.js](file:///Users/staruntejas/Desktop/Gurukul/server/routes/notes.js)

On note creation, award +5 credits and log activity.

#### [MODIFY] [server/routes/chat.js](file:///Users/staruntejas/Desktop/Gurukul/server/routes/chat.js)

On chat message, award +2 credits and log activity (capped at 20 credits/day from chat).

#### [MODIFY] [DataContext.jsx](file:///Users/staruntejas/Desktop/Gurukul/src/context/DataContext.jsx)

Add `fetchStreak()` function and `streakData` state. Call it on login and expose it to the dashboard.

#### [MODIFY] [StudentDashboard.jsx](file:///Users/staruntejas/Desktop/Gurukul/src/pages/StudentDashboard.jsx)

Replace the static streak/credits display with live data from the streaks API:
- **Streak card**: Show current streak with flame emoji animation, consecutive day markers (7-day heat map).
- **Credits card**: Show total balance with a recent earnings breakdown.
- Add a "Daily Check-In" visual indicator (pulsing dot if not yet checked in today).

---

## Open Questions

> [!IMPORTANT]
> 1. **Google Cloud Project**: Do you already have a Google Cloud Console project, or should I walk you through creating one? It's free and takes ~2 minutes.
> 2. **Deployment**: Are you okay with **Render.com free tier** for the live URL? The free tier sleeps after 15 mins of inactivity (first request takes ~30s to wake up). Upgraded plan ($7/mo) keeps it always-on.
> 3. **Data persistence**: For the 60-100 student test — is it okay if the database re-seeds on each Render deploy? Or do you need persistent data between deployments? (If persistent, we'll need Render Disk or a hosted Postgres.)

---

## Verification Plan

### Automated Tests

1. **Registration flow**: Use browser subagent to register a new account via email, verify redirect to student dashboard.
2. **Google Sign-In**: Verify the button renders and the endpoint accepts tokens (manual test with your Google account).
3. **Mobile responsiveness**: Resize browser to 375×812 (iPhone viewport), verify bottom nav appears, sidebar hides, all content is single-column and scrollable.
4. **Streak system**: Login → verify streak increments. Create a note → verify +5 credits. Open next day → verify streak counter updates.
5. **Load capacity**: Run `npx artillery run load-test.yml` with 60-100 concurrent users, verify all endpoints respond < 500ms at p95.
6. **Production build**: Run `npm run build && npm start`, verify the app works at `http://localhost:3001`.

### Manual Verification

- Access the live Render URL on a real phone to verify mobile experience.
- Test Google Sign-In on the deployed URL (Google OAuth only works on registered domains).
