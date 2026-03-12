import "../styles/viewitems.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/toastContext";
import { getItems, claimItem, getMessages, sendMessage, deleteItem } from "../services/items";
import { API_BASE, BASE_URL } from "../config";

export default function ViewItems() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
  const [claimId, setClaimId] = useState(null);
  const [claimEmail, setClaimEmail] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      return u?.email || localStorage.getItem("userEmail") || "";
    } catch {
      return localStorage.getItem("userEmail") || "";
    }
  });
  const [proofs, setProofs] = useState("");
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [detailItem, setDetailItem] = useState(null);
  const [viewMode, setViewMode] = useState("cards"); // cards | details
  const admin = (() => { try { return JSON.parse(localStorage.getItem("admin")); } catch { return null; } })();
  const canDelete = !!admin;
  const srcFor = (img) => {
    if (!img || typeof img !== "string") return "/images/item-placeholder.svg";
    if (img.startsWith("/uploads/")) return `${BASE_URL}${img}`;
    if (img.startsWith("/images/")) return img;
    if (/^https?:\/\//.test(img)) return img;
    return "/images/item-placeholder.svg";
  };

  // ✅ LOAD ITEMS
  const loadItems = async () => {
    try {
      const data = await getItems();
      setItems(data);
    } catch (err) {
      console.error("Error loading items:", err);
    }
  };

  useEffect(() => {
    loadItems();
    const t = setInterval(loadItems, 15000);
    return () => clearInterval(t);
  }, []);

  // ✅ FILTER ITEMS
  const filteredItems = items.filter(item => {
    const matchSearch =
      (item.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.location || "").toLowerCase().includes(search.toLowerCase());

    const matchStatus = status === "All" || item.status === status;
    const matchCategory = category === "All" || item.category === category;

    return matchSearch && matchStatus && matchCategory;
  });

  const categories = ["All", ...new Set(items.map(i => i.category))];

  // ✅ CLAIM MODAL ACTIONS
  const openClaim = (id) => {
    setClaimId(id);
    setProofs("");
  };
  const closeClaim = () => {
    setClaimId(null);
    setProofs("");
  };
  const submitClaim = async () => {
    if (!claimEmail) {
      showToast("Enter your email", "error");
      return;
    }
    try {
      const proofArr = proofs.split(",").map(s => s.trim()).filter(Boolean);
      await claimItem(claimId, claimEmail, proofArr);
      localStorage.setItem("userEmail", claimEmail);
      showToast("Claim request sent ✅", "success");
      closeClaim();
      loadItems();
    } catch (e) {
      console.error(e);
      showToast("Error sending claim request", "error");
    }
  };

  const openMessage = async (item) => {
    try {
      const userEmail = localStorage.getItem("userEmail") || "";
      let toEmail = null;
      if (userEmail) {
        if (userEmail === item.claimedBy && item.email) toEmail = item.email;
        if (userEmail === item.email && item.claimedBy) toEmail = item.claimedBy;
      }
      if (!toEmail) {
        toEmail = item.claimedBy || item.email || "";
      }

      const peer = {
        _id: null,
        email: toEmail || "",
        name: (toEmail || "").split("@")[0] || "User",
        itemId: item._id,
        itemName: item.name,
        contact: item.contact
      };

      // Save to last peer for Chat page to pick up
      localStorage.setItem("chat:lastPeer", JSON.stringify({
        id: null,
        email: peer.email,
        name: peer.name,
        itemId: peer.itemId,
        itemName: peer.itemName,
        contact: peer.contact
      }));

      // Add to recent list
      const key = "chat:recent";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      const filtered = existing.filter(p => p.email !== peer.email);
      localStorage.setItem(key, JSON.stringify([{
        id: null,
        email: peer.email,
        name: peer.name,
        itemId: peer.itemId,
        itemName: peer.itemName,
        contact: peer.contact,
        ts: Date.now()
      }, ...filtered].slice(0, 20)));

      navigate("/chat");
    } catch (e) {
      console.error(e);
      showToast("Error opening chat", "error");
    }
  };

  const openDetails = (item) => setDetailItem(item);
  const closeDetails = () => setDetailItem(null);
  const copyContact = async (text) => {
    try { await navigator.clipboard.writeText(text || ""); } catch { void 0; }
  };

  return (
    <div>
      <h1 className="page-title">📦 Lost & Found Items</h1>

      {/* ⭐ FILTER BAR */}
      <div className="filter-bar glass">

        <input
          type="text"
          placeholder="Search item, location, description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="premium-search"
        />

        <select
          className="premium-select"
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option>All</option>
          <option>Lost</option>
          <option>Found</option>
        </select>

        <select
          className="premium-select"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          {categories.map((cat, i) => (
            <option key={i}>{cat}</option>
          ))}
        </select>

        <div style={{ marginLeft: "auto" }} className="view-toggle">
          <button
            className={`seg ${viewMode === "cards" ? "active" : ""}`}
            onClick={() => setViewMode("cards")}
            title="Cards view"
          >
            Cards
          </button>
          <button
            className={`seg ${viewMode === "details" ? "active" : ""}`}
            onClick={() => setViewMode("details")}
            title="Details view"
          >
            Details
          </button>
        </div>
      </div>

      {/* ⭐ DETAILS VIEW (reference style) */}
      {viewMode === "details" && (
        <div className="detail-grid">
          {filteredItems.length === 0 ? (
            <div className="glass p-4 rounded-2xl" style={{ textAlign: "center" }}>No items found</div>
          ) : (
            filteredItems.map(item => (
              <div key={item._id} className="glass detail-card">
                <div className="detail-fields">
                  <div><span className="field">Item Name:</span> <strong>{item.name || "-"}</strong></div>
                  <div><span className="field">Type:</span> <span className={`status-text ${item.status?.toLowerCase()}`}>{item.status}</span></div>
                  <div><span className="field">Category:</span> {item.category || "-"}</div>
                  {item.description ? <div><span className="field">Description:</span> {item.description}</div> : null}
                  <div><span className="field">Address:</span> {item.location || "-"}</div>
                  <div><span className="field">Contact:</span> {item.contact || "-"}</div>
                  <div><span className="field">Email:</span> {item.email || "-"}</div>
                  <div><span className="field">Date:</span> {item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}</div>
                </div>
                <div className="detail-image">
                  {item.image ? (
                    <img src={srcFor(item.image)} alt={item.name} />
                  ) : (
                    <div className="img-placeholder">{(item.name || "?").slice(0,1)}</div>
                  )}
                </div>
                <div className="detail-actions">
                  {item.status === "Found" ? (
                    <button className="action-btn green sm" onClick={() => openClaim(item._id)}>Claim</button>
                  ) : null}
                  {(item.email || item.claimedBy) ? (
                    <button className="action-btn blue sm" onClick={() => openMessage(item)}>Message</button>
                  ) : null}
                  {canDelete ? (
                    <button className="action-btn red sm" onClick={async () => { if (confirm("Delete this item?")) { await deleteItem(item._id); loadItems(); }}}>Delete</button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ⭐ CARDS VIEW */}
      {viewMode === "cards" && (
        <div className="cards-grid">
          {filteredItems.length === 0 ? (
            <div className="glass p-4 rounded-2xl" style={{ textAlign: "center" }}>No items found</div>
          ) : (
            filteredItems.map(item => (
              <div key={item._id} className="glass item-card2">
                <div className="item-img-wrap" onClick={() => openDetails(item)}>
                  {item.image ? (
                    <img src={srcFor(item.image)} alt={item.name} className="item-img" />
                  ) : (
                    <div className="item-img placeholder">{(item.name || "?").slice(0,1)}</div>
                  )}
                </div>
                <div className="item-body">
                  <div className="item-title">
                    <button className="link" onClick={() => openDetails(item)} style={{ all: "unset", cursor: "pointer" }}>
                      <strong>{item.name}</strong>
                    </button>
                  </div>
                  <div className="item-meta">
                    <span className="badge" style={{ opacity: .9 }}>{item.category}</span>
                    <span className={`badge ${item.status === "Lost" ? "lost" : "found"}`}>{item.status}</span>
                  </div>
                  <div className="item-sub">
                    <div>{item.location || "-"}</div>
                    <div>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}</div>
                  </div>
                  {item.description && (
                    <div className="item-desc">
                      {item.description.length > 90 ? item.description.slice(0, 90) + "…" : item.description}
                    </div>
                  )}
                  <div className="item-actions">
                    {item.status === "Found" ? (
                      <button className="action-btn green sm" onClick={() => openClaim(item._id)}>Claim</button>
                    ) : <span />}
                    {(item.email || item.claimedBy) ? (
                      <button className="action-btn blue sm" onClick={() => openMessage(item)}>Message</button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ⭐ ITEM DETAILS DRAWER */}
      {detailItem && (
        <div className="modal-backdrop" onClick={closeDetails}>
          <div className="glass details-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="details-header">
              <h3 style={{ margin: 0 }}>{detailItem.name}</h3>
              <button className="action-btn sm" onClick={closeDetails}>✕</button>
            </div>
            <div className="details-body">
              <div className="details-media">
                {detailItem.image ? (
                  <img src={srcFor(detailItem.image)} alt={detailItem.name} />
                ) : (
                  <div className="media-placeholder">{(detailItem.name || "?").slice(0,1)}</div>
                )}
              </div>
              <div className="details-info">
                <div className="row"><strong>Category:</strong> {detailItem.category || "-"}</div>
                <div className="row"><strong>Location:</strong> {detailItem.location || "-"}</div>
                <div className="row"><strong>Status:</strong> <span className={`badge ${detailItem.status === "Lost" ? "lost" : "found"}`}>{detailItem.status}</span></div>
                <div className="row"><strong>Contact:</strong> {detailItem.contact || "-"} {detailItem.contact && <button className="action-btn sm" onClick={() => copyContact(detailItem.contact)}>Copy</button>}</div>
                {detailItem.description && <div className="row"><strong>Description:</strong> {detailItem.description}</div>}
              </div>
            </div>
            <div className="modal-actions">
              {detailItem.status === "Found" ? (
                <button className="action-btn green" onClick={() => { openClaim(detailItem._id); closeDetails(); }}>Claim</button>
              ) : null}
              {(detailItem.email || detailItem.claimedBy) ? (
                <button className="action-btn blue" onClick={() => { openMessage(detailItem); closeDetails(); }}>Message</button>
              ) : null}
              <button className="action-btn" onClick={closeDetails}>Close</button>
            </div>
          </div>
        </div>
      )}
      {claimId && (
        <div className="modal-backdrop">
          <div className="glass modal" style={{ width: 420 }}>
            <h3>Claim Item</h3>
            <div className="text-sm" style={{ opacity: 0.8, marginBottom: 6 }}>
              Enter your email and optional proof URLs (comma separated).
            </div>
            <input
              className="ui-input"
              placeholder="Email"
              value={claimEmail}
              onChange={e => setClaimEmail(e.target.value)}
            />
            <input
              className="ui-input"
              placeholder="Proof URLs (optional, comma-separated)"
              value={proofs}
              onChange={e => setProofs(e.target.value)}
              style={{ marginTop: 8 }}
            />
            <div className="modal-actions">
              <button className="action-btn blue" onClick={closeClaim}>Cancel</button>
              <button className="action-btn green" onClick={submitClaim}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
