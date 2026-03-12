import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "../components/Button";
import Input from "../components/Input";
import { useToast } from "../components/toastContext";
import { loginAdmin } from "../services/auth";
import "../styles/auth.css";
import API from "../api";

export default function Login() {

  const navigate = useNavigate();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [openSignup, setOpenSignup] = useState(false);
  const [sName, setSName] = useState("");
  const [sEmail, setSEmail] = useState("");
  const [sPassword, setSPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await loginAdmin({ email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("admin", JSON.stringify(data.admin));
      showToast("Login Success ✅", "success");
      navigate("/admin");
    } catch (err) {
      const msg = err?.response?.data?.msg || err?.message || "Login failed";
      showToast(msg, "error");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-title">Admin Login</div>
        <form onSubmit={handleLogin} className="auth-actions">
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <div className="auth-meta">
            <Link to="#" className="link">Forgot password?</Link>
          </div>
          <Button type="submit" variant="primary" size="md">Login</Button>
          <div className="auth-meta">
            <span>Don't have an admin account? </span>
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
              <Button
                variant="primary"
                onClick={async () => {
                  try {
                    const res = await API.post("/auth/register", { name: sName.trim(), email: sEmail.trim(), password: sPassword.trim() });
                    if (res?.data) {
                      setOpenSignup(false);
                      setEmail(sEmail.trim());
                      setPassword(sPassword.trim());
                      showToast("Admin account created ✅", "success");
                    }
                  } catch (err) {
                    const msg = err?.response?.data?.msg || "Signup failed";
                    showToast(msg, "error");
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
