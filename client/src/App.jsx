import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaMoon, FaSun } from "react-icons/fa";

import "./styles/landing.css";

import Sidebar from "./components/Sidebar";
import ProtectedRoutes from "./components/ProtectedRoutes";

import Dashboard from "./pages/Dashboard";
import ReportLost from "./pages/ReportLost";
import ReportFound from "./pages/ReportFound";
import ViewItems from "./pages/ViewItems";
import Messages from "./pages/Messages";
import Admin from "./pages/Admin";
import Analytics from "./pages/Analytics";
import Claims from "./pages/Claims";
import Users from "./pages/Users";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import UserDashboard from "./pages/UserDashboard";
import NotificationsBell from "./components/NotificationsBell";
import UserLogin from "./pages/UserLogin";
import Notifications from "./pages/Notifications";
import Chat from "./pages/Chat";
import UserRegister from "./pages/UserRegister";

/* ⭐ Layout Controller (Hide Sidebar on Landing) */
function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState("dark");
  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    navigate("/login");
  };
  const admin = (() => {
    try { return JSON.parse(localStorage.getItem("admin")); } catch { return null; }
  })();
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  })();
  const displayName = admin?.name || user?.name;

  const hideSidebarRoutes = ["/", "/login", "/user-login", "/register", "/user-register"];
  const titles = {
    "/dashboard": "Dashboard",
    "/report-lost": "Report Lost",
    "/report-found": "Report Found",
    "/browse": "Items",
    "/chat": "Chat",
    "/admin": "Admin Panel",
    "/admin-users": "Users",
    "/admin-claims": "Claims",
    "/admin-notifications": "Notifications",
    "/user-login": "User Login",
    "/user-dashboard": "My Dashboard",
    "/notifications": "Notifications",
    "/discover": "Discover",
  };
  const title = titles[location.pathname] || "";

  return (
    <div className="app-layout">

      {/* ⭐ Sidebar Hide on Landing + Auth Pages */}
      {!hideSidebarRoutes.includes(location.pathname) && <Sidebar />}

      {/* Global floating theme toggle for pages without topbar */}
      {hideSidebarRoutes.includes(location.pathname) && (
        <button
          onClick={toggleTheme}
          className="theme-toggle floating-theme-toggle"
          aria-label="Toggle theme (global)"
          title="Toggle light/dark"
        >
          {theme === "dark" ? <FaSun /> : <FaMoon />}
        </button>
      )}

      <div className={`main-content ${hideSidebarRoutes.includes(location.pathname) ? "full" : ""}`}>
        {!hideSidebarRoutes.includes(location.pathname) && (
          <div className={"topbar glass dark-chrome"} style={{ marginBottom: 20, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontWeight: 800 }}>{title}</h2>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <NotificationsBell />
              <button
                onClick={toggleTheme}
                className="theme-toggle"
                aria-label="Toggle theme"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: "2px solid var(--border-color)",
                  background: "var(--surface-2)",
                  color: "var(--text)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 0 3px rgba(59,130,246,0.25)"
                }}
              >
                {theme === "dark" ? <FaSun /> : <FaMoon />}
              </button>
              {displayName && (
                <span style={{ color: "var(--text)", fontWeight: 800, letterSpacing: 0.2, padding: "6px 10px", borderRadius: 12, background: "rgba(255,255,255,0.08)", border: "1px solid var(--border-color)" }}>
                  {displayName}
                </span>
              )}
              <button
                onClick={handleLogout}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(239,68,68,0.35)",
                  background: "linear-gradient(90deg,#ef4444,#f43f5e)",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                Logout
              </button>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "linear-gradient(90deg,#22c55e,#3b82f6)",
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700
              }}>LF</div>
            </div>
          </div>
        )}

        <Routes>

          {/* ⭐ LANDING PAGE FIRST */}
          <Route path="/" element={<Landing />} />

          {/* ⭐ MAIN APP */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/report-lost" element={<ReportLost />} />
          <Route path="/report-found" element={<ReportFound />} />
          <Route path="/browse" element={<ViewItems />} />
          {/* Discover merged into My Reports */}
          <Route path="/messages" element={<Messages />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/chat" element={<Chat />} />

          {/* ⭐ AUTH */}
          <Route path="/login" element={<Login />} />
          <Route path="/user-login" element={<UserLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/user-register" element={<UserRegister />} />

          {/* ⭐ ADMIN PROTECTED */}
          <Route
            path="/admin"
            element={
              <ProtectedRoutes>
                <Admin />
              </ProtectedRoutes>
            }
          />
          <Route
            path="/admin-notifications"
            element={
              <ProtectedRoutes>
                <Notifications />
              </ProtectedRoutes>
            }
          />
          <Route
            path="/admin-users"
            element={
              <ProtectedRoutes>
                <Users />
              </ProtectedRoutes>
            }
          />
          <Route
            path="/admin-claims"
            element={
              <ProtectedRoutes>
                <Claims />
              </ProtectedRoutes>
            }
          />
          <Route
            path="/admin-analytics"
            element={
              <ProtectedRoutes>
                <Analytics />
              </ProtectedRoutes>
            }
          />
          <Route
            path="/admin-claims"
            element={<div style={{ padding: 20 }}>This page has been removed.</div>}
          />
          {/* User Dashboard*/}
          <Route path="/user-dashboard" element={<UserDashboard />} />

        </Routes>

      </div>
    </div>
  );
}


/* ⭐ MAIN APP */
export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}
