const API = "/mailapi";
const LS_KEY = "inbox_temporanee_accounts";
const POLL_INTERVAL = 15000;

export { API, LS_KEY, POLL_INTERVAL };

// ---- Utilities ----
export function randStr(len = 10) {
  return Math.random().toString(36).substring(2, 2 + len);
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---- localStorage helpers ----
export function loadSavedAccounts() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveAccount(index, address, password) {
  try {
    const all = loadSavedAccounts();
    all[index] = { address, password };
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch {}
}

export function clearAccount(index) {
  try {
    const all = loadSavedAccounts();
    delete all[index];
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch {}
}

export function clearAllAccounts() {
  try { localStorage.removeItem(LS_KEY); } catch {}
}

// ---- API calls ----
export async function fetchDomains() {
  const res = await fetch(`${API}/domains?page=1`);
  if (!res.ok) throw new Error("Impossibile ottenere domini");
  const data = await res.json();
  return data["hydra:member"].map((d) => d.domain);
}

export async function getToken(address, password, retries = 5, baseDelay = 2000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(`${API}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, password }),
    });
    if (res.status === 429) {
      await sleep(baseDelay * Math.pow(2, attempt) + Math.random() * 500);
      continue;
    }
    if (!res.ok) throw new Error("Errore autenticazione");
    const data = await res.json();
    return data.token;
  }
  throw new Error("Impossibile ottenere token");
}

export async function createAccount(domain, retries = 5, baseDelay = 2000) {
  const address = `${randStr(12)}@${domain}`;
  const password = randStr(16);
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${API}/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, password }),
      });
      if (res.status === 429) {
        await sleep(baseDelay * Math.pow(2, attempt) + Math.random() * 500);
        continue;
      }
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e["hydra:description"] || `HTTP ${res.status}`);
      }
      await sleep(400);
      const token = await getToken(address, password, retries, baseDelay);
      return { address, password, token };
    } catch (e) {
      if (attempt === retries) throw e;
      await sleep(baseDelay * Math.pow(2, attempt));
    }
  }
  throw new Error("Troppi tentativi falliti");
}

export async function fetchMessages(token) {
  const res = await fetch(`${API}/messages?page=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data["hydra:member"] || [];
}

export async function fetchMessageBody(token, id) {
  const res = await fetch(`${API}/messages/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Impossibile caricare il messaggio");
  return res.json();
}
