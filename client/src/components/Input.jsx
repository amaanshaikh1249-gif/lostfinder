import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./Input.css";
export default function Input({ variant = "default", size = "md", className = "", type = "text", ...props }) {
  const inputClasses = ["ui-input", `ui-input-${variant}`, `ui-input-${size}`, className].join(" ").trim();
  const [visible, setVisible] = useState(false);
  if (type === "password") {
    return (
      <div className="password-wrap">
        <input className={inputClasses} type={visible ? "text" : "password"} {...props} />
        <button type="button" className="eye-btn" onClick={() => setVisible(v => !v)} aria-label="Toggle password visibility">
          {visible ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    );
  }
  return <input className={inputClasses} type={type} {...props} />;
}
