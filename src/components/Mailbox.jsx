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
      <div className="mailbox-box">
        {/* Header */}
        <div className="mailbox-header">
          {(status === "waiting" || status === "loading") && (
            <span className="addr-muted">
              {status === "waiting" ? `In attesa (slot ${index + 1})...` : "Caricamento..."}
            </span>
          )}
          {status === "error" && (
            <span className="addr-error" title={error}>{error}</span>
          )}
          {status === "ready" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="addr-text" title={address}>{address}</span>
              {restored && (
                <span className="badge-restored" title="Ripristinata da localStorage">↩</span>
              )}
            </div>
          )}
        </div>

        {/* Barra polling */}
        {status === "ready" && (
          <div className="poll-bar">
            <PollDot polling={polling} />
            <span className="poll-text">
              {polling
                ? "Aggiornamento..."
                : lastUpdate
                  ? `Aggiornato alle ${formatLastUpdate(lastUpdate)} · prossimo tra ${countdown ?? "…"}s`
                  : "In attesa..."}
            </span>
          </div>
        )}

        {/* Lista messaggi */}
        <div className="msg-list">
          {status === "ready" && messages.length === 0 && (
            <div className="msg-empty">Nessuna email ricevuta</div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="msg-item"
              onClick={() => setOpenMsg(msg)}
              title="Clicca per aprire"
            >
              <div className="msg-top">
                <span className="msg-from">{msg.from?.address || "sconosciuto"}</span>
                <span className="msg-time">{formatTime(msg.createdAt)}</span>
              </div>
              <div className="msg-subject">{msg.subject || "(nessun oggetto)"}</div>
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
