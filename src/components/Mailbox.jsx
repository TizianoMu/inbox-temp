import { useState } from "react";
import { useMailbox } from "../hooks/useMailbox";
import MessageModal from "./MessageModal";
import PollDot from "./PollDot";

function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

function formatLastUpdate(d) {
  if (!d) return "";
  return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function Mailbox({ domains, index, triggerKey }) {
  const {
    address, token, messages, status, error,
    polling, lastUpdate, countdown, restored,
  } = useMailbox(domains, index, triggerKey);

  const [openMsg, setOpenMsg] = useState(null);

  return (
    <>
      <div style={styles.box}>
        {/* Header */}
        <div style={styles.header}>
          {(status === "waiting" || status === "loading") && (
            <span style={styles.addrMuted}>
              {status === "waiting" ? `In attesa (slot ${index + 1})...` : "Caricamento..."}
            </span>
          )}
          {status === "error" && (
            <span style={styles.addrError} title={error}>{error}</span>
          )}
          {status === "ready" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={styles.addr} title={address}>{address}</span>
              {restored && (
                <span style={styles.restoredBadge} title="Ripristinata da localStorage">↩</span>
              )}
            </div>
          )}
        </div>

        {/* Barra polling */}
        {status === "ready" && (
          <div style={styles.pollBar}>
            <PollDot polling={polling} />
            <span style={styles.pollText}>
              {polling
                ? "Aggiornamento..."
                : lastUpdate
                  ? `Aggiornato alle ${formatLastUpdate(lastUpdate)} · prossimo tra ${countdown ?? "…"}s`
                  : "In attesa..."}
            </span>
          </div>
        )}

        {/* Lista messaggi */}
        <div style={styles.msgList}>
          {status === "ready" && messages.length === 0 && (
            <div style={styles.empty}>Nessuna email ricevuta</div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={styles.msg}
              onClick={() => setOpenMsg(msg)}
              title="Clicca per aprire"
            >
              <div style={styles.msgTop}>
                <span style={styles.from}>{msg.from?.address || "sconosciuto"}</span>
                <span style={styles.time}>{formatTime(msg.createdAt)}</span>
              </div>
              <div style={styles.subject}>{msg.subject || "(nessun oggetto)"}</div>
            </div>
          ))}
        </div>
      </div>

      {openMsg && token && (
        <MessageModal token={token} msg={openMsg} onClose={() => setOpenMsg(null)} />
      )}
    </>
  );
}

const styles = {
  box: {
    background: "#fff", border: "1px solid #ccc",
    display: "flex", flexDirection: "column", overflow: "hidden",
  },
  header: {
    borderBottom: "1px solid #ccc", padding: "6px 10px",
    background: "#fafafa", minHeight: 30,
  },
  addr: {
    fontSize: "12px", color: "#333", overflow: "hidden",
    textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
  },
  addrMuted: { fontSize: "12px", color: "#999", display: "block" },
  addrError: {
    fontSize: "11px", color: "#c00", display: "block",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  restoredBadge: { fontSize: "11px", color: "#888", flexShrink: 0, cursor: "default" },
  pollBar: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "3px 10px", borderBottom: "1px solid #eee", background: "#fafafa",
  },
  pollText: { fontSize: "10px", color: "#888" },
  msgList: { flex: 1, overflowY: "auto", padding: "4px 0" },
  empty: { padding: "12px 10px", fontSize: "11px", color: "#999" },
  msg: { padding: "6px 10px", borderBottom: "1px solid #eee", cursor: "pointer" },
  msgTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  from: {
    fontSize: "11px", color: "#555", overflow: "hidden",
    textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%",
  },
  time: { fontSize: "10px", color: "#aaa", flexShrink: 0 },
  subject: {
    fontSize: "12px", color: "#222", marginTop: "2px",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
};
