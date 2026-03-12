import { API_BASE } from "../config";

export async function getItems() {
  const res = await fetch(`${API_BASE}/item`);
  return res.json();
}

export async function deleteItem(id) {
  const res = await fetch(`${API_BASE}/item/delete/${id}`, { method: "DELETE" });
  return res.json();
}

export async function addItem(form, status, image) {
  const fd = new FormData();
  Object.keys(form).forEach(k => fd.append(k, form[k]));
  fd.append("status", status);
  if (image) fd.append("image", image);
  const res = await fetch(`${API_BASE}/item/add`, { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Error");
  return data;
}

export async function claimItem(id, email, proofsArr = []) {
  const res = await fetch(`${API_BASE}/item/claim/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, proofs: proofsArr })
  });
  return res.json();
}

export async function getMessages(itemId) {
  const res = await fetch(`${API_BASE}/item/message/${itemId}`);
  return res.json();
}

export async function sendMessage(itemId, from, to, text) {
  const res = await fetch(`${API_BASE}/item/message/${itemId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, text })
  });
  return res.json();
}

export async function sendImageMessage(itemId, from, to, file) {
  const fd = new FormData();
  fd.append("from", from);
  fd.append("to", to);
  fd.append("file", file);
  const res = await fetch(`${API_BASE}/item/message/image/${itemId}`, {
    method: "POST",
    body: fd
  });
  return res.json();
}

export async function getUserDashboard(email) {
  const res = await fetch(`${API_BASE}/item/user/${encodeURIComponent(email)}`);
  return res.json();
}

export async function getItemSummary(id) {
  const res = await fetch(`${API_BASE}/item/summary/${id}`);
  return res.json();
}
