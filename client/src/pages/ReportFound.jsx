import { useEffect, useMemo, useState } from "react";
import { useToast } from "../components/toastContext";
import { getItems, addItem } from "../services/items";
import { rankMatches } from "../utils/match";

export default function ReportFound() {

  const defaultEmail = (JSON.parse(localStorage.getItem("user"))?.email) || localStorage.getItem("userEmail") || "";
  const [form, setForm] = useState({
    name: "",
    category: "",
    location: "",
    contact: "",
    email: defaultEmail,
    description: ""
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const { showToast } = useToast();

  // ===== INPUT CHANGE =====
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ===== IMAGE SELECT =====
  const handleImage = file => {
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  // ===== DRAG DROP =====
  const handleDrop = e => {
    e.preventDefault();
    handleImage(e.dataTransfer.files[0]);
  };

  // ===== SUBMIT =====
  const handleSubmit = async e => {
    e.preventDefault();

    if (!form.name || !form.category || !form.location) {
      alert("Fill required fields");
      return;
    }

    try {
      setLoading(true);
      const email = (form.email || defaultEmail || "").trim();
      const payload = { ...form, email };
      const data = await addItem(payload, "Found", image);
      if (data.matches?.length) {
        showToast(`AI found ${data.matches.length} potential matches. Email alerts sent.`, "success");
      } else {
        showToast("Found item reported", "success");
      }

      if (email) {
        localStorage.setItem("userEmail", email);
        try {
          const arr = JSON.parse(localStorage.getItem("user:emails") || "[]");
          const next = Array.from(new Set([email, ...arr])).slice(0, 10);
          localStorage.setItem("user:emails", JSON.stringify(next));
        } catch { void 0; }
      }
      

      // RESET
      setForm({
        name: "",
        category: "",
        location: "",
        contact: "",
        email: email,
        description: ""
      });
      setImage(null);
      setPreview(null);

    } catch (err) {
      showToast(err.message || "Server Error", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try { setItems(await getItems()); } catch (e) { console.error(e); }
    })();
  }, []);

  const suggestions = useMemo(() => {
    const lostItems = items.filter(i => i.status === "Lost");
    return rankMatches(form, lostItems);
  }, [items, form]);

  return (
    <div className="form-page">
      <h1 className="page-title">🔍 Report Found Item</h1>

      <form className="glass-form" onSubmit={handleSubmit}>

        <input name="name" placeholder="Item Name *"
          value={form.name} onChange={handleChange} />

        <input name="category" placeholder="Category *"
          value={form.category} onChange={handleChange} />

        <input name="location" placeholder="Found Location *"
          value={form.location} onChange={handleChange} />

        <input name="contact" placeholder="Contact Number"
          value={form.contact} onChange={handleChange} />

        <input name="email" placeholder="Email"
          value={form.email} onChange={handleChange} />

        <textarea name="description" placeholder="Description"
          value={form.description} onChange={handleChange} />

        {/* IMAGE DROP AREA */}
        <div
          className="upload-box"
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        >
          <input
            type="file"
            onChange={e => handleImage(e.target.files[0])}
          />

          {preview && (
            <img src={preview} alt="preview" className="preview-img" />
          )}
        </div>

        <button disabled={loading}>
          {loading ? "Submitting..." : "Submit Found Item"}
        </button>

      </form>
      {suggestions.length > 0 && (
        <div className="match-box glass">
          <h3>AI Match Detection</h3>
          {suggestions.map(s => (
            <div key={s.ref._id} className="match-card">
              <div>
                <strong>{s.ref.name}</strong>
                <p>{s.ref.location} • {s.ref.category}</p>
              </div>
              <small>{Math.round(s.score * 100)}% match</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
