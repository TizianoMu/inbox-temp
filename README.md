# Inbox Temporanee

A React app that displays **6 temporary email inboxes simultaneously** in a split-screen layout. Each inbox is a real, functional email address generated via the [Mail.tm](https://mail.tm) API. Emails arrive in real time through automatic polling, and can be opened in a clean popup viewer with full HTML rendering.

> **Repository:** [https://github.com/TizianoMu/inbox-temp](https://github.com/TizianoMu/inbox-temp)

---

## Features

- **6 live temporary inboxes** displayed side by side in a 3×2 grid
- **Automatic polling** every 15 seconds with a live countdown and visual indicator
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
   - If expired or missing → creates a new account (staggered by `index × 2s`)
3. Once authenticated, each mailbox polls `GET /messages` every 15 seconds
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

All tuneable constants are at the top of their respective files:

| Constant | File | Default | Description |
|---|---|---|---|
| `POLL_INTERVAL` | `api/mailApi.js` | `15000` | Milliseconds between inbox polls |
| `LS_KEY` | `api/mailApi.js` | `inbox_temporanee_accounts` | localStorage key for saved accounts |
| Stagger delay | `hooks/useMailbox.js` | `index × 2000ms` | Delay between mailbox creations |
| Retry attempts | `api/mailApi.js` | `5` | Max retries on API errors |

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
