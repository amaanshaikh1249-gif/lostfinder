import { useState } from "react";
import { registerAdmin } from "../services/auth";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await registerAdmin({ name, email, password });
      if (data) {
        alert("✅ Admin registered successfully");
        setName("");
        setEmail("");
        setPassword("");
      } else {
        alert("❌ Registration failed");
      }

    } catch (err) {
      alert("❌ Server error");
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="form-page">
      <h1 className="page-title">Register Admin</h1>

      <form className="glass-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button disabled={loading}>
          {loading ? "Creating..." : "Create Admin Account"}
        </button>
      </form>
    </div>
  );
}
