# Inbox Temporanee

A React app that displays a **configurable number of temporary email inboxes (up to 10)** simultaneously in a split-screen layout. Each inbox is a real, functional email address generated via the [Mail.tm](https://mail.tm) API. Emails arrive in real time through automatic polling, and can be opened in a clean popup viewer with full HTML rendering.

> **Repository:** [https://github.com/TizianoMu/inbox-temp](https://github.com/TizianoMu/inbox-temp)

---

## Features

- **Configurable number of live temporary inboxes (up to 10)** displayed side by side in a dynamic grid
- **Automatic polling** every `VITE_POLL_INTERVAL_MS` milliseconds with a live countdown and visual indicator
- **HTML email rendering** inside a sandboxed iframe, with a plain-text fallback
- **HTML / Text toggle** when both versions of an email are available
- **Persistent accounts** via `localStorage` — addresses survive page reloads
- **Staggered account creation** to avoid rate limiting (one mailbox every 2 seconds)
- **Automatic retry** with exponential backoff on API errors
- **"Recreate all"** button to wipe saved accounts and generate 6 fresh ones

---

## How it works

### Architecture

```
src/
├── App.jsx                  # Root component — layout, domain fetching, global state
├── api/
│   └── mailApi.js           # All Mail.tm API calls + localStorage helpers
├── hooks/
│   └── useMailbox.js        # Per-mailbox state: init, polling, countdown
└── components/
    ├── Mailbox.jsx          # Single inbox UI (header, poll bar, message list)
    ├── MessageModal.jsx     # Popup email viewer (HTML iframe + text fallback)
    └── PollDot.jsx          # Green/grey animated dot indicating poll status
```

### Flow

1. On load, `App.jsx` fetches available domains from `api.mail.tm/domains`
2. Each `Mailbox` slot checks `localStorage` for a saved `{ address, password }`
   - If found → re-authenticates silently to get a fresh token
   - If expired or missing → creates a new account (staggered by `index × VITE_STAGGER_DELAY_MS` milliseconds)
3. Once authenticated, each mailbox polls `GET /messages` every `VITE_POLL_INTERVAL_MS` milliseconds
4. Clicking a message opens `MessageModal`, which fetches the full body via `GET /messages/:id` and renders it inside a sandboxed `<iframe>`
### CORS

Mail.tm's API does not allow direct browser requests. A **Vite dev proxy** is used to forward all `/mailapi/*` requests to `https://api.mail.tm`, bypassing CORS in development.

---

## Requirements

- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/TizianoMu/inbox-temp.git
cd inbox-temp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The 6 inboxes will initialize automatically over the first ~12 seconds.

---

## Configuration

The application is configured via environment variables. Create a `.env` file in the root of your project using `.env.example` as a template:

```env
VITE_MAIL_API_URL=https://api.mail.tm/v1/
VITE_MAILBOX_COUNT=6
VITE_LS_KEY=inbox_temporanee_accounts
VITE_POLL_INTERVAL_MS=15000
VITE_STAGGER_DELAY_MS=2000
VITE_API_RETRIES=5
```

### Parameters:

- `VITE_MAIL_API_URL`: The base endpoint for API calls. Default: `https://api.mail.tm/v1/`.
- `VITE_MAILBOX_COUNT`: Number of email mailboxes to display in the grid (Max: 10). Default: `6`.
- `VITE_LS_KEY`: The `localStorage` key used to store saved accounts. Default: `inbox_temporanee_accounts`.
- `VITE_POLL_INTERVAL_MS`: The interval in milliseconds between polling for new messages. Default: `15000` (15s).
- `VITE_STAGGER_DELAY_MS`: Delay between the creation of each mailbox to avoid rate limiting. Default: `2000` (2s).
- `VITE_API_RETRIES`: Maximum number of retries for API calls on failure. Default: `5`.

---

## Production deployment

The Vite proxy only works in development (`npm run dev`). For production builds you need a server-side proxy. Options:

- **Vercel** — add a `vercel.json` with a rewrite rule pointing `/mailapi/*` to `https://api.mail.tm/*`
- **Netlify** — add a `_redirects` file: `/mailapi/* https://api.mail.tm/:splat 200`
- **Custom server** — set up Nginx or a small Express proxy

---

## Notes

- Temporary email accounts on Mail.tm expire after a period of inactivity. If an account is no longer valid on reload, the app automatically deletes it from `localStorage` and creates a new one for that slot.
- The email iframe uses `sandbox="allow-same-origin allow-popups"` — scripts inside emails are intentionally blocked for security.
- This app is intended for development and testing purposes (e.g. testing registration flows, verifying transactional emails).
