import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { FiGithub, FiLinkedin, FiMail } from "react-icons/fi";
import "../styles/landing.css";
import HeroIllustration from "../components/HeroIllustration";
import { HERO_IMAGE_URL } from "../config";
export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const theme = localStorage.getItem("theme") || "light";
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, []);
  useEffect(() => {
    const ids = ["home", "features", "about", "contact", "how"];
    const sections = ids
      .map(id => document.getElementById(id))
      .filter(Boolean);
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -55% 0px", threshold: 0.1 }
    );
    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);
  return (
    <div className="landing">
      <nav className={(scrolled ? "nav scrolled" : "nav") + (theme === "light" ? " dark-chrome" : "")}>
        <div className="container">
          <div className="nav-left">
            <div className="logo">LostFinder</div>
            <ul className="menu">
              <li><a href="#home" className={activeSection === "home" ? "active" : ""}>Home</a></li>
              <li><a href="#features" className={activeSection === "features" ? "active" : ""}>Features</a></li>
              <li><a href="#about" className={activeSection === "about" ? "active" : ""}>About</a></li>
              <li><a href="#contact" className={activeSection === "contact" ? "active" : ""}>Contact</a></li>
            </ul>
          </div>
          <div className="nav-right">
            <Link to="/user-login" className="btn primary nav-btn">Create Account</Link>
          </div>
        </div>
      </nav>

      <section id="home" className="saas-hero">
        <div className="container saas-hero-grid">
          <div className="hero-left">
            <h1 className="saas-title">AI-Powered Lost & Found Management System</h1>
            <p className="saas-sub">
              Smart AI matching that connects lost and found reports in seconds — improving recovery rates and streamlining verification.
            </p>
            <div className="hero-actions">
              <Link to="/user-login" className="btn primary">Get Started</Link>
              <a href="#how" className="btn outline">Learn More</a>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-visual3d">
              <img src="/images/ai-hero.webp" alt="Futuristic AI technology" />
            </div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container cta-box">
          <div>
            <div className="cta-text">Start Using LostFinder Today</div>
          </div>
        </div>
      </section>

      <section className={"portal" + (theme === "light" ? " dark-chrome" : "")}>
        <div className="container">
          <h2 style={{ textAlign: "center", marginBottom: 16 }}>Login Portal</h2>
          <div className="features-grid">
            <div className="feature-card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="feature-title">Users</div>
              <div className="feature-desc">Report, track, and get notifications.</div>
              <div>
                <Link to="/user-login" className="btn outline">User Login</Link>
              </div>
            </div>
            <div className="feature-card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="feature-title">Administrators</div>
              <div className="feature-desc">Review claims and manage items.</div>
              <div>
                <Link to="/login" className="btn outline">Admin Login</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="about">
        <div className="container">
          <h2>About LostFinder</h2>
          <p className="about-text">
            LostFinder addresses the common problem of misplaced items across campuses and organizations.
            By leveraging intelligent AI matching, the system improves the efficiency of finding potential matches
            between lost and found reports. It streamlines reporting, status tracking, notifications, and admin verification
            to simplify the entire lost & found process for students, staff, and administrators.
          </p>
        </div>
      </section>

      <section className="stats">
        <div className="container stats-grid">
          <div className="stat">
            <div className="stat-value">15,000+</div>
            <div className="stat-label">Items Reported</div>
          </div>
          <div className="stat">
            <div className="stat-value">94%</div>
            <div className="stat-label">AI Match Accuracy</div>
          </div>
          <div className="stat">
            <div className="stat-value">30+</div>
            <div className="stat-label">Institutions Onboarded</div>
          </div>
          <div className="stat">
            <div className="stat-value">99.9%</div>
            <div className="stat-label">System Uptime</div>
          </div>
        </div>
      </section>

      <section id="features" className={"features" + (theme === "light" ? " dark-chrome" : "")}>
        <div className="container">
          <h2>Core Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="icon">👤</div>
              <div className="feature-title">User Registration & Login</div>
              <div className="feature-desc">Secure access with authentication.</div>
            </div>
            <div className="feature-card">
              <div className="icon">📝</div>
              <div className="feature-title">Report Lost Item</div>
              <div className="feature-desc">Submit details of lost items.</div>
            </div>
            <div className="feature-card">
              <div className="icon">📦</div>
              <div className="feature-title">Report Found Item</div>
              <div className="feature-desc">Register items found by users.</div>
            </div>
            <div className="feature-card">
              <div className="icon">🔐</div>
              <div className="feature-title">AI-Based Smart Matching</div>
              <div className="feature-desc">Detect potential matches intelligently.</div>
            </div>
            <div className="feature-card">
              <div className="icon">📧</div>
              <div className="feature-title">Email Notifications</div>
              <div className="feature-desc">Receive alerts when matches occur.</div>
            </div>
            <div className="feature-card">
              <div className="icon">🗂️</div>
              <div className="feature-title">Admin Dashboard Management</div>
              <div className="feature-desc">Manage reports and item statuses.</div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="how">
        <div className="container">
          <h2>How It Works</h2>
          <div className="steps-grid">
            <div className="step">
              <div className="step-icon">📝</div>
              <div className="step-title">Report Item</div>
              <div className="step-desc">Submit details in seconds.</div>
            </div>
            <div className="step">
              <div className="step-icon">🤖</div>
              <div className="step-title">AI Matches</div>
              <div className="step-desc">Our AI scans and finds potential matches.</div>
            </div>
            <div className="step">
              <div className="step-icon">📣</div>
              <div className="step-title">Get Notified</div>
              <div className="step-desc">Instant alerts when a match is found.</div>
            </div>
            <div className="step">
              <div className="step-icon">✅</div>
              <div className="step-title">Admin Verification</div>
              <div className="step-desc">Admin verifies and closes the case.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="modules">
        <div className="container">
          <h2>System Modules</h2>
          <div className="modules-grid">
            <div className="module-card">
              <div className="module-title">User Module</div>
              <div className="module-desc">Handles registration, login, and user reports.</div>
            </div>
            <div className="module-card">
              <div className="module-title">Admin Module</div>
              <div className="module-desc">Manages items, claims, and verification workflows.</div>
            </div>
            <div className="module-card">
              <div className="module-title">AI Matching Module</div>
              <div className="module-desc">Runs similarity logic to detect potential matches.</div>
            </div>
            <div className="module-card">
              <div className="module-title">Notification Module</div>
              <div className="module-desc">Sends alerts via email when matches are found.</div>
            </div>
          </div>
        </div>
      </section>

      

      

      <footer id="contact" className="lf-footer">
        <div className="container">
          <div className="lf-wrap">
            <div className="lf-grid">
              <details className="lf-col" open>
                <summary>About</summary>
                <div className="lf-brand">LostFinder</div>
                <p className="lf-desc">AI-powered lost & found platform.</p>
                <div className="lf-meta">v1.0 • AY 2025–2026</div>
                <div className="lf-socials">
                  <a href="https://github.com/" aria-label="GitHub" target="_blank" rel="noreferrer"><FiGithub /></a>
                  <a href="https://linkedin.com/" aria-label="LinkedIn" target="_blank" rel="noreferrer"><FiLinkedin /></a>
                  <a href="mailto:support@lostfinder.com" aria-label="Email"><FiMail /></a>
                </div>
              </details>
              <details className="lf-col" open>
                <summary>Quick Links</summary>
                <ul className="lf-links">
                  <li><a href="#home">Home</a></li>
                  <li><Link to="/report-lost">Report Lost Item</Link></li>
                  <li><Link to="/report-found">Report Found Item</Link></li>
                  <li><Link to="/discover">AI Matches</Link></li>
                  <li><Link to="/login">Admin Login</Link></li>
                </ul>
              </details>
              <details className="lf-col" open>
                <summary>Contact Information</summary>
                <ul className="lf-contact">
                  <li>Email: support@lostfinder.com</li>
                  <li>Phone: +91 9999888800</li>
                  <li>Location: Mumbai, Maharashtra, India</li>
                </ul>
              </details>
              <details className="lf-col" open>
                <summary>Resources</summary>
                <ul className="lf-links">
                  <li><a href="#">Privacy Policy</a></li>
                  <li><a href="#">Terms & Conditions</a></li>
                </ul>
              </details>
            </div>
            <div className="lf-divider" />
            <div className="lf-bottom">
              <div className="lf-brand-center">LostFinder</div>
              <div className="lf-copy">© {new Date().getFullYear()} LostFinder. All rights reserved.</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
