import { useEffect, useState, useCallback } from "react";
import { getNotifications, markNotificationRead } from "../services/notifications";
export default function Notifications() {
  const [list, setList] = useState([]);
  const email = (() => {
    try {
      const admin = JSON.parse(localStorage.getItem("admin"));
      if (admin?.email) return admin.email;
      const user = JSON.parse(localStorage.getItem("user"));
      if (user?.email) return user.email;
      return localStorage.getItem("userEmail") || "";
    } catch {
      return localStorage.getItem("userEmail") || "";
    }
  })();
  const load = useCallback(async () => {
    if (!email) return;
    try {
      const data = await getNotifications(email);
      setList(data);
    } catch (e) {
      console.error(e);
    }
  }, [email]);
  useEffect(() => {
    load();
  }, [load]);
  const markRead = async (id) => {
    try {
      await markNotificationRead(id);
      setList(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };
  const markAllRead = async () => {
    for (const n of list.filter(n => !n.read)) {
      try { await markNotificationRead(n._id); } catch {}
    }
    setList(prev => prev.map(n => ({ ...n, read: true })));
  };
  return (
    <div className="form-page">
      <h1 className="page-title">Notifications</h1>
      {!email && (
        <div className="glass" style={{ padding: 12, marginBottom: 12 }}>
          <strong>Set your email</strong>
          <div style={{ fontSize: 13, opacity: 0.8 }}>Report or claim an item to register your email for notifications.</div>
        </div>
      )}
      <div className="glass" style={{ padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontWeight: 700 }}>Latest (up to 50)</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="action-btn blue" onClick={load}>Refresh</button>
            <button className="action-btn green" onClick={markAllRead} disabled={list.every(n => n.read)}>Mark all read</button>
          </div>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {list.length === 0 ? (
            <div style={{ padding: 12, opacity: 0.7 }}>No notifications</div>
          ) : list.map(n => (
            <div key={n._id} style={{
              padding: 12, borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.09)",
              background: n.read ? "rgba(255,255,255,0.04)" : "rgba(34,197,94,0.1)",
              display: "grid", gap: 4
            }}>
              <div style={{ fontWeight: 700 }}>{n.title}</div>
              {n.body && <div style={{ fontSize: 13, opacity: 0.9 }}>{n.body}</div>}
              <div style={{ fontSize: 12, opacity: 0.65 }}>{new Date(n.createdAt).toLocaleString()}</div>
              {!n.read && (
                <div>
                  <button className="action-btn" onClick={() => markRead(n._id)} style={{ fontSize: 12 }}>Mark read</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
