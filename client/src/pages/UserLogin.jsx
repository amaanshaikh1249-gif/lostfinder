import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Button from "../components/Button";
import Input from "../components/Input";
import { useToast } from "../components/toastContext";
import API from "../api";
import "../styles/auth.css";

export default function UserLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast() || { showToast: () => {} };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [openSignup, setOpenSignup] = useState(false);
  const [sName, setSName] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sPassword, setSPassword] = useState("");
  const [sConfirm, setSConfirm] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if ((params.get("signup") || "").toLowerCase() === "1") {
      setOpenSignup(true);
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    try {
      const res = await API.post("/user/login", { email: email.trim(), password: password.trim() });
      const user = res?.data?.user;
      if (user) {
        if (res?.data?.token) localStorage.setItem("userToken", res.data.token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("userEmail", user.email);
        showToast && showToast("Logged in as user ✅", "success");
        navigate("/items");
      }
    } catch (err) {
      const msg = err?.response?.data?.msg || "Login failed";
      showToast && showToast(msg, "error");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-title">User Login</div>
        <form onSubmit={handleSubmit} className="auth-actions">
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <div className="auth-meta">
            <Link to="#" className="link">Forgot password?</Link>
          </div>
          <Button type="submit" variant="primary" size="md">Login</Button>
          <div className="auth-meta">
            <span>Don't have an account? </span>
            <a className="link" href="#" onClick={(e) => { e.preventDefault(); setOpenSignup(true); }}>Signup</a>
          </div>
        </form>
      </div>
      {openSignup && (
        <div className="auth-backdrop">
          <div className="auth-modal">
            <div className="auth-modal-header">
              <div className="auth-title" style={{ margin: 0 }}>Signup</div>
              <button className="auth-close" onClick={() => setOpenSignup(false)}>✖</button>
            </div>
            <div className="auth-actions">
              <Input type="text" placeholder="Full name" value={sName} onChange={(e) => setSName(e.target.value)} required />
              <Input type="email" placeholder="Email" value={sEmail} onChange={(e) => setSEmail(e.target.value)} required />
              <Input type="password" placeholder="Create password" value={sPassword} onChange={(e) => setSPassword(e.target.value)} required />
              <Input type="password" placeholder="Confirm password" value={sConfirm} onChange={(e) => setSConfirm(e.target.value)} required />
              <Button
                variant="primary"
                onClick={async () => {
                  if (!sPassword.trim() || sPassword.trim() !== sConfirm.trim()) {
                    showToast && showToast("Passwords do not match", "error");
                    return;
                  }
                  try {
                    const res = await API.post("/user/register", { name: sName.trim(), email: sEmail.trim(), password: sPassword.trim() });
                    if (res?.data) {
                      localStorage.setItem("user", JSON.stringify({ name: res.data.name, email: res.data.email }));
                      localStorage.setItem("userEmail", res.data.email);
                      setOpenSignup(false);
                      showToast && showToast("Account created ✅", "success");
                    }
                  } catch (err) {
                    const msg = err?.response?.data?.msg || "Signup failed";
                    showToast && showToast(msg, "error");
                  }
                }}
              >
                Signup
              </Button>
              <div className="auth-meta">
                <span>Already have an account? </span>
                <a className="link" href="#" onClick={(e) => { e.preventDefault(); setOpenSignup(false); }}>Login</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
