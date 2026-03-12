import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  FaHome,
  FaCompass,
  FaClipboardList,
  FaSearch,
  FaBoxOpen,
  FaUserShield,
  FaUsers,
  FaChartLine,
  FaClipboardCheck,
  FaSignOutAlt,
  FaBars
} from "react-icons/fa";

import "./Sidebar.css";

export default function Sidebar() {

  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [collapsed, setCollapsed] = useState(false);

  const token = localStorage.getItem("token");
  JSON.parse(localStorage.getItem("admin"));
  const isAdminContext = Boolean(token) && (pathname === "/admin" || pathname.startsWith("/admin-"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    navigate("/login");
  };

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>

      {/* TOP */}
      <div className="sidebar-top">
        <h2 className="logo">LostFinder</h2>

        <button
          className="toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          <FaBars />
        </button>
      </div>

      {/* NAV */}
      <nav>
        {isAdminContext ? (
          <>
            <NavLink to="/admin" className={({ isActive }) => `nav-item admin${isActive ? " active" : ""}`}>
              <FaUserShield />
              <span>Admin Panel</span>
            </NavLink>
            <NavLink to="/admin-claims" className={({ isActive }) => `nav-item admin${isActive ? " active" : ""}`}>
              <FaClipboardCheck />
              <span>Claims</span>
            </NavLink>
            <NavLink to="/admin-users" className={({ isActive }) => `nav-item admin${isActive ? " active" : ""}`}>
              <FaUsers />
              <span>Users</span>
            </NavLink>
            <NavLink to="/admin-analytics" className={({ isActive }) => `nav-item admin${isActive ? " active" : ""}`}>
              <FaChartLine />
              <span>Analytics</span>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
              <FaHome />
              <span>Overview</span>
            </NavLink>
            <NavLink to="/browse" className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
              <FaCompass />
              <span>Browse Items</span>
            </NavLink>
            <NavLink to="/report-lost" className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
              <FaSearch />
              <span>Report Lost</span>
            </NavLink>
            <NavLink to="/report-found" className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
              <FaBoxOpen />
              <span>Report Found</span>
            </NavLink>
            <NavLink to="/chat" className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
              <FaClipboardCheck />
              <span>Messages</span>
            </NavLink>
            <NavLink to="/user-dashboard" className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}>
              <FaClipboardList />
              <span>My Reports</span>
            </NavLink>
            <div className="divider"></div>
          </>
        )}
      </nav>

    </div>
  );
}
