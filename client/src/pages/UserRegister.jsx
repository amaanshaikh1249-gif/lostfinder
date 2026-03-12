import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "../components/Button";
import Input from "../components/Input";
import { useToast } from "../components/toastContext";
import API from "../api";
import "../styles/auth.css";

export default function UserRegister() {
  const navigate = useNavigate();
  const { showToast } = useToast() || { showToast: () => {} };
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const submit = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) return;
    if (password.trim() !== confirm.trim()) {
      showToast && showToast("Passwords do not match", "error");
      return;
    }
    try {
      const res = await API.post("/user/register", { name: name.trim(), email: email.trim(), password: password.trim() });
      if (res?.data) {
        localStorage.setItem("user", JSON.stringify({ name: res.data.name, email: res.data.email }));
        localStorage.setItem("userEmail", res.data.email);
        showToast && showToast("Account created ✅", "success");
        navigate("/items");
      }
    } catch (err) {
      const msg = err?.response?.data?.msg || "Registration failed";
      showToast && showToast(msg, "error");
    }
  };

  return (
    <div className="auth-backdrop">
      <div className="auth-modal">
        <div className="auth-modal-header">
          <div className="auth-title" style={{ margin: 0 }}>Signup</div>
          <button className="auth-close" onClick={() => navigate("/user-login")}>✖</button>
        </div>
        <div className="auth-actions">
          <Input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Create password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Input type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <Button variant="primary" onClick={submit}>Signup</Button>
          <div className="auth-meta">
            <span>Already have an account? </span>
            <Link to="/user-login" className="link">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
