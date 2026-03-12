import "./Button.css";
export default function Button({ variant = "primary", size = "md", className = "", children, ...props }) {
  const classes = ["ui-btn", `ui-btn-${variant}`, `ui-btn-${size}`, className].join(" ").trim();
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
