import axios from "axios";
import { API_BASE } from "./config";
const API = axios.create({ baseURL: API_BASE });

API.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem("token");
  const userToken = localStorage.getItem("userToken");
  const token = adminToken || userToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
