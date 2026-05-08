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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-meta">
            <div className="modal-subject" title={msg.subject}>
              {msg.subject || "(nessun oggetto)"}
            </div>
            <div className="modal-from">
              <span className="meta-label">Da:</span> {msg.from?.address || "sconosciuto"}
            </div>
            {msg.to?.[0]?.address && (
              <div className="modal-to">
                <span className="meta-label">A:</span> {msg.to[0].address}
              </div>
            )}
          </div>

          <div className="header-right">
            {/* Toggle HTML / Testo solo se entrambi disponibili */}
            {hasHtml && hasText && (
              <div className="toggle-group">
                <button
                  className={`btn-toggle ${view === "html" ? "active" : ""}`}
                  onClick={() => setView("html")}
                >HTML</button>
                <button
                  className={`btn-toggle ${view === "text" ? "active" : ""}`}
                  onClick={() => setView("text")}
                >Testo</button>
              </div>
            )}
            <button className="btn-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">
          {loading && <div className="modal-status-text">Caricamento...</div>}
          {error && <div className="modal-error-text">{error}</div>}

          {!loading && !error && view === "html" && html && (
            <iframe
              srcDoc={buildHtmlDoc(html)}
              sandbox="allow-same-origin allow-popups"
              className="modal-iframe"
              title="email-body"
            />
          )}

          {!loading && !error && view === "text" && (
            <div className="text-wrap">
              <pre className="plain-text">{text || "(nessun contenuto)"}</pre>
            </div>
          )}

          {!loading && !error && !html && !text && (
            <div className="modal-status-text">(nessun contenuto)</div>
          )}
        </div>

      </div>
    </div>
  );
}
