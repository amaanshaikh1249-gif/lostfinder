import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { getMessages, sendMessage } from "../services/items";
export default function Messages() {
  const [params] = useSearchParams();
  const itemId = params.get("itemId");
  const otherEmail = params.get("toEmail") || "";
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [fromEmail, setFromEmail] = useState(localStorage.getItem("userEmail") || "");
  const load = useCallback(async () => {
    if (!itemId) return;
    try {
      const data = await getMessages(itemId);
      setMessages(data);
    } catch (e) {
      console.error(e);
    }
  }, [itemId]);
  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [itemId, load]);
  const canSend = useMemo(() => Boolean(itemId && fromEmail && (otherEmail || messages[0]?.to || messages[0]?.from)), [itemId, fromEmail, otherEmail, messages]);
  const to = otherEmail || (messages[0] && (messages[0].from === fromEmail ? messages[0].to : messages[0].from)) || "";
  const send = async (e) => {
    e.preventDefault();
    if (!canSend || !text.trim()) return;
    try {
      await sendMessage(itemId, fromEmail, to, text);
      setText("");
      load();
    } catch (e) {
      console.error(e);
    }
  };
  return (
    <div className="form-page">
      <h1 className="page-title">Direct Messages</h1>
      {!fromEmail && (
        <div className="glass" style={{ padding: 12, marginBottom: 12 }}>
          <strong>Enter your email to start messaging</strong>
          <input
            className="ui-input"
            placeholder="Your email"
            value={fromEmail}
            onChange={e => setFromEmail(e.target.value)}
            onBlur={() => localStorage.setItem("userEmail", fromEmail)}
          />
        </div>
      )}
      <div className="glass" style={{ padding: 12 }}>
        <div style={{ maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {messages.map(m => (
            <div key={m._id} style={{
              alignSelf: m.from === fromEmail ? "flex-end" : "flex-start",
              padding: 10, borderRadius: 10,
              background: m.from === fromEmail ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)",
              maxWidth: "70%"
            }}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{m.from}</div>
              <div>{m.text}</div>
              <div style={{ fontSize: 11, opacity: 0.6 }}>{new Date(m.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
        <form onSubmit={send} style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input className="ui-input" placeholder="Type a message..." value={text} onChange={e => setText(e.target.value)} />
          <button className="ui-btn ui-btn-primary" disabled={!canSend}>Send</button>
        </form>
      </div>
    </div>
  );
}
