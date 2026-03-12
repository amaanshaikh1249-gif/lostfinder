import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getNotifications, markNotificationRead } from "../services/notifications";
export default function NotificationsBell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const email = (JSON.parse(localStorage.getItem("admin"))?.email) || localStorage.getItem("userEmail") || "";
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
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [email, load]);
  const unread = list.filter(n => !n.read).length;
  const markRead = async (id) => {
    try {
      await markNotificationRead(id);
      setList(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => {
          const token = localStorage.getItem("token");
          const isAdminContext = Boolean(token) && (pathname === "/admin" || pathname.startsWith("/admin-"));
          navigate(isAdminContext ? "/admin-notifications" : "/notifications");
        }}
        style={{
          width: 36, height: 36, borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.06)",
          color: "white", cursor: "pointer", position: "relative"
        }}
        aria-label="Notifications"
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: "absolute", top: -6, right: -6,
            background: "#ef4444", color: "white",
            borderRadius: "50%", padding: "2px 6px", fontSize: 12, fontWeight: 700
          }}>{unread}</span>
        )}
      </button>
    </div>
  );
}
