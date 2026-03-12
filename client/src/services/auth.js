import API from "../api";

export async function registerAdmin({ name, email, password }) {
  const res = await API.post("/auth/register", { name, email, password });
  return res.data;
}

export async function loginAdmin({ email, password }) {
  const res = await API.post("/auth/login", { email, password });
  return res.data;
}
