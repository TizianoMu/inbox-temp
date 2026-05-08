import { useState, useEffect } from "react";
import { fetchDomains, clearAllAccounts } from "./api/mailApi";
import Mailbox from "./components/Mailbox";

export default function App() {
  const [domains, setDomains] = useState(null);
  const [domainError, setDomainError] = useState(null);
  const [triggerKey, setTriggerKey] = useState(0);

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
    <div style={styles.root}>
      <div style={styles.titleRow}>
        <span style={styles.title}>Inbox Temporanee</span>
        <button style={styles.reloadBtn} onClick={handleReset}>
          Ricrea tutto
        </button>
      </div>
      {domainError && (
        <div style={styles.globalError}>Errore domini: {domainError}</div>
      )}
      <div style={styles.grid}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Mailbox key={i} domains={domains || []} index={i} triggerKey={triggerKey} />
        ))}
      </div>
    </div>
  );
}

const styles = {
  root: {
    minHeight: "100vh", background: "#f5f5f5",
    padding: "16px", fontFamily: "monospace", boxSizing: "border-box",
  },
  titleRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  title: { fontSize: "18px", fontWeight: "bold", color: "#111" },
  reloadBtn: {
    fontSize: "11px", padding: "3px 10px", cursor: "pointer",
    border: "1px solid #aaa", background: "#fff", borderRadius: 3,
  },
  globalError: { color: "red", marginBottom: 8, fontSize: 13 },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
    gridTemplateRows: "repeat(2, 1fr)", gap: "8px",
    height: "calc(100vh - 60px)",
  },
};
