import { useState, useEffect } from "react";
import { fetchDomains, clearAllAccounts } from "./api/mailApi";
import Mailbox from "./components/Mailbox";
import "./App.css";

const DEFAULT_MAILBOX_COUNT = 6;
const MAX_MAILBOX_COUNT = 10;

export default function App() {
  const [domains, setDomains] = useState(null);
  const [domainError, setDomainError] = useState(null);
  const [triggerKey, setTriggerKey] = useState(0);

  const mailboxCount = Math.min(
    parseInt(import.meta.env.VITE_MAILBOX_COUNT) || DEFAULT_MAILBOX_COUNT,
    MAX_MAILBOX_COUNT
  );
  useEffect(() => {
    fetchDomains()
      .then(setDomains)
      .catch((e) => setDomainError(e.message));
  }, []);

  function handleReset() {
    clearAllAccounts();
    setTriggerKey((k) => k + 1);
  }

  return (
    <div className="app-root">
      <div className="title-row">
        <span className="app-title">Inbox Temporanee</span>
        <button className="btn-secondary" onClick={handleReset}>
          Ricrea tutto
        </button>
      </div>
      {domainError && (
        <div className="error-global">Errore domini: {domainError}</div>
      )}
      <div className="mailbox-grid">
        {Array.from({ length: mailboxCount }).map((_, i) => (
          <Mailbox key={i} domains={domains || []} index={i} triggerKey={triggerKey} />
        ))}
      </div>
    </div>
  );
}
