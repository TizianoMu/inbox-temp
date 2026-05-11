# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server at http://localhost:5173
npm run build     # Production build
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
```

No test suite is configured.

## Environment setup

Copy `.env.example` to `.env` before running. Key variables:

| Variable | Default | Purpose |
|---|---|---|
| `VITE_MAIL_API_URL` | `https://api.mail.tm/v1/` | Mail.tm API base URL |
| `VITE_MAILBOX_COUNT` | `6` | Number of inboxes shown (max 10) |
| `VITE_POLL_INTERVAL_MS` | `15000` | Polling interval per mailbox |
| `VITE_STAGGER_DELAY_MS` | `2000` | Delay between mailbox creations (rate-limit avoidance) |
| `VITE_API_RETRIES` | `5` | Max retries with exponential backoff on 429s |
| `VITE_LS_KEY` | `inbox_temporanee_accounts` | localStorage key for persisted accounts |

## Architecture

**CORS proxy:** The Mail.tm API blocks direct browser requests. In dev, `vite.config.js` proxies `/mailapi/*` → `https://api.mail.tm`. `mailApi.js` uses `/mailapi` as the base URL. In production you need a server-side proxy (Vercel rewrite, Netlify `_redirects`, or Nginx).

**Data flow:**
1. `App.jsx` fetches available domains on mount, then renders N `<Mailbox>` slots
2. Each `Mailbox` calls `useMailbox(domains, index, triggerKey)` — the hook owns all per-mailbox state
3. `useMailbox` checks `localStorage` for a saved `{ address, password }` for that slot index, re-authenticates if found, or creates a new account (staggered by `index × STAGGER_DELAY_MS`)
4. Once a token is obtained, the hook starts a `setInterval` polling loop (`fetchMessages`) and a separate 1s countdown ticker
5. Clicking a message opens `MessageModal`, which lazily fetches the full body via `GET /messages/:id` and renders HTML in a sandboxed `<iframe>` (scripts blocked)

**Reset flow:** The "Ricrea tutto" button calls `clearAllAccounts()` (removes the localStorage key) then increments `triggerKey` in `App`, which propagates to each `useMailbox` and re-triggers its `useEffect` init sequence.

**Key files:**
- `src/api/mailApi.js` — all Mail.tm API calls, localStorage helpers, exported env constants (`API`, `POLL_INTERVAL`, etc.)
- `src/hooks/useMailbox.js` — per-mailbox lifecycle: init, token, polling loop, countdown
- `src/components/Mailbox.jsx` — renders one inbox panel; consumes `useMailbox`
- `src/components/MessageModal.jsx` — email viewer popup; fetches full body on open

## UI language

The app UI is in Italian (`it-IT` locale for timestamps, Italian status strings).
