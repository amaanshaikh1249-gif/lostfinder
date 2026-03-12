import API from "../api";
export async function searchUsers(query) {
  const res = await API.get(`/chat/users`, { params: { search: query } });
  return res.data;
}
export async function listConversations() {
  const res = await API.get(`/chat/conversations`);
  return res.data;
}
export async function getMessages(peerId) {
  const res = await API.get(`/chat/messages/${peerId}`);
  return res.data;
}
export async function sendMessage({ receiverId, message, itemId }) {
  const res = await API.post(`/chat/messages`, { receiverId, message, itemId });
  return res.data;
}
export async function uploadImageMessage({ receiverId, file, itemId }) {
  const fd = new FormData();
  fd.append("receiverId", receiverId);
  fd.append("file", file);
  if (itemId) fd.append("itemId", itemId);
  const res = await API.post(`/chat/messages/image`, fd, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
}
export async function getUserById(id) {
  const res = await API.get(`/chat/user/${id}`);
  return res.data;
}
export async function getUserByEmail(email) {
  const res = await API.get(`/chat/user/email/${email}`);
  return res.data;
}
export async function legacyConversations(email) {
  const res = await API.get(`/chat/legacy/conversations`, { params: { email } });
  return res.data;
}
export async function legacyMessages({ email, peerEmail }) {
  const res = await API.get(`/chat/legacy/messages`, { params: { email, peerEmail } });
  return res.data;
}
