import { useState, useEffect } from "react";
import { fetchMessageBody } from "../api/mailApi";

// Wrappa il contenuto HTML in un documento completo con stili base leggibili
function buildHtmlDoc(html) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 16px 20px;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: #222;
    background: #fff;
    word-break: break-word;
  }
  img { max-width: 100%; height: auto; }
  a { color: #1a73e8; }
  p { margin: 0 0 10px; }
  table { max-width: 100%; }
</style>
</head>
<body>${html}</body>
</html>`;
}

export default function MessageModal({ token, msg, onClose }) {
  const [html, setHtml] = useState(null);
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("html"); // "html" | "text"

  useEffect(() => {
    fetchMessageBody(token, msg.id)
      .then((data) => {
        const rawHtml = data.html?.[0] || null;
        const rawText = data.text || null;
        setHtml(rawHtml);
        setText(rawText);
        // Se non c'è HTML, mostra testo direttamente
        if (!rawHtml) setView("text");
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [token, msg.id]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const hasHtml = !!html;
  const hasText = !!text;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={styles.modalHeader}>
          <div style={styles.modalMeta}>
            <div style={styles.modalSubject} title={msg.subject}>
              {msg.subject || "(nessun oggetto)"}
            </div>
            <div style={styles.modalFrom}>
              <span style={styles.metaLabel}>Da:</span> {msg.from?.address || "sconosciuto"}
            </div>
            {msg.to?.[0]?.address && (
              <div style={styles.modalTo}>
                <span style={styles.metaLabel}>A:</span> {msg.to[0].address}
              </div>
            )}
          </div>

          <div style={styles.headerRight}>
            {/* Toggle HTML / Testo solo se entrambi disponibili */}
            {hasHtml && hasText && (
              <div style={styles.toggle}>
                <button
                  style={{ ...styles.toggleBtn, ...(view === "html" ? styles.toggleActive : {}) }}
                  onClick={() => setView("html")}
                >HTML</button>
                <button
                  style={{ ...styles.toggleBtn, ...(view === "text" ? styles.toggleActive : {}) }}
                  onClick={() => setView("text")}
                >Testo</button>
              </div>
            )}
            <button style={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={styles.modalBody}>
          {loading && <div style={styles.modalLoading}>Caricamento...</div>}
          {error && <div style={styles.modalError}>{error}</div>}

          {!loading && !error && view === "html" && html && (
            <iframe
              srcDoc={buildHtmlDoc(html)}
              sandbox="allow-same-origin allow-popups"
              style={styles.iframe}
              title="email-body"
            />
          )}

          {!loading && !error && view === "text" && (
            <div style={styles.textWrap}>
              <pre style={styles.plainText}>{text || "(nessun contenuto)"}</pre>
            </div>
          )}

          {!loading && !error && !html && !text && (
            <div style={styles.modalLoading}>(nessun contenuto)</div>
          )}
        </div>

      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#fff",
    width: "72vw", maxWidth: 860, height: "82vh",
    display: "flex", flexDirection: "column",
    borderRadius: 4,
    boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
    padding: "12px 16px", borderBottom: "1px solid #e0e0e0",
    background: "#f9f9f9", gap: 12, flexShrink: 0,
  },
  modalMeta: { flex: 1, minWidth: 0 },
  modalSubject: {
    fontSize: "15px", fontWeight: "600", color: "#111",
    marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  modalFrom: { fontSize: "12px", color: "#444", marginBottom: 2 },
  modalTo: { fontSize: "12px", color: "#444" },
  metaLabel: { color: "#999", marginRight: 3 },
  headerRight: { display: "flex", alignItems: "center", gap: 10, flexShrink: 0 },
  toggle: { display: "flex", border: "1px solid #ccc", borderRadius: 3, overflow: "hidden" },
  toggleBtn: {
    fontSize: "11px", padding: "3px 9px", cursor: "pointer",
    background: "#fff", border: "none", color: "#555",
  },
  toggleActive: { background: "#e8e8e8", color: "#111", fontWeight: "bold" },
  closeBtn: {
    background: "none", border: "none", fontSize: "18px", cursor: "pointer",
    color: "#888", padding: "0 2px", lineHeight: 1,
  },
  modalBody: { flex: 1, overflow: "hidden", background: "#fff" },
  iframe: { width: "100%", height: "100%", border: "none", display: "block" },
  textWrap: { height: "100%", overflowY: "auto" },
  plainText: {
    margin: 0, padding: "16px 20px", fontSize: "13px", color: "#333",
    fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word",
    lineHeight: 1.6,
  },
  modalLoading: { padding: "24px 16px", fontSize: "13px", color: "#999" },
  modalError: { padding: "24px 16px", fontSize: "13px", color: "#c00" },
};
