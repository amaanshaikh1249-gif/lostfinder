import { API_BASE } from "../config";

export async function getNotifications(email) {
  const res = await fetch(`${API_BASE}/item/notifications/${encodeURIComponent(email)}`);
  return res.json();
}

export async function markNotificationRead(id) {
  const res = await fetch(`${API_BASE}/item/notifications/read/${id}`, { method: "PUT" });
  return res.json();
}
