import { useEffect, useState } from "react";
import { FiCheck, FiCornerUpLeft, FiRotateCcw, FiTrash2 } from "react-icons/fi";
import api from "../api";
import { useToast } from "../components/toastContext";
import { API_BASE, BASE_URL } from "../config";
import "../styles/viewitems.css";

export default function Admin() {

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [viewMode, setViewMode] = useState("cards");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const { showToast } = useToast() || { showToast: () => {} };
  const srcFor = (img) => {
    if (!img || typeof img !== "string") return "/images/item-placeholder.svg";
    if (img.startsWith("/uploads/")) return `${BASE_URL}${img}`;
    if (img.startsWith("/images/")) return img;
    if (/^https?:\/\//.test(img)) return img;
    return "/images/item-placeholder.svg";
  };

  // ⭐ LOAD ITEMS
  const loadItems = async () => {
    try {
      const res = await api.get("/item");
      setItems(res.data);
      setLoading(false);
    } catch (err) {
      // 
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // ⭐ DELETE ITEM
  const deleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) return;
    try {
      await api.delete(`/item/delete/${id}`);
      loadItems();
      showToast && showToast("Item deleted", "success");
    } catch {
      showToast && showToast("Delete failed", "error");
    }
  };
  const requestDelete = (id) => deleteItem(id);
  const confirmDelete = async () => {
    // Legacy - replaced by direct deleteItem confirm
  };

  // ⭐ UPDATE LOST / FOUND STATUS
  const updateStatus = async (id, status) => {
    try {
      await api.put(`/item/status/${id}`, { status });
      loadItems();
      showToast && showToast(`Status set to ${status}`, "success");
    } catch {
      showToast && showToast("Status update failed", "error");
    }
  };

  // (Claims page removed) — claim approve/reject managed elsewhere

  if (loading) return <h2>Loading...</h2>;

  const filteredItems = items.filter(item => {
    const q = search.toLowerCase();
    const matchSearch =
      (item.name || "").toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q) ||
      (item.location || "").toLowerCase().includes(q) ||
      (item.category || "").toLowerCase().includes(q);
    const matchStatus = status === "All" || item.status === status;
    return matchSearch && matchStatus;
  });

  return (
    <div>

      <h1 className="page-title">🛠 Admin Control Panel</h1>

      <div className="filter-bar glass" style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search item, location, description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="premium-search"
          style={{ flex: 1 }}
        />
        <select
          className="premium-select"
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option>All</option>
          <option>Lost</option>
          <option>Found</option>
          <option>Returned</option>
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

      <div className="glass" style={{ padding: 16 }}>
        {items.length === 0 ? (
          <div className="glass p-4 rounded-2xl" style={{ textAlign: "center" }}>No items found</div>
        ) : (
          <>
            {viewMode === "cards" && (
              <div className="cards-grid">
                {filteredItems.map(item => (
                  <div key={item._id} className="glass item-card2">
                    <div className="item-img-wrap" onClick={() => setDetailItem(item)}>
                      {item.image ? (
                        <img src={srcFor(item.image)} alt={item.name} className="item-img" />
                      ) : (
                        <div className="item-img placeholder">{(item.name || "?").slice(0,1)}</div>
                      )}
                    </div>
                    <div className="item-body">
                      <div className="item-title">
                        <button className="link" onClick={() => setDetailItem(item)} style={{ all: "unset", cursor: "pointer" }}>
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
                      <div className="item-actions">
                        <button
                          className="action-btn green sm"
                          onClick={() => updateStatus(item._id, "Found")}
                          disabled={item.status === "Found" || item.status === "Returned"}
                        >
                          Mark Found
                        </button>
                        <button
                          className="action-btn blue sm"
                          onClick={() => updateStatus(item._id, "Lost")}
                          disabled={item.status === "Lost" || item.status === "Returned"}
                        >
                          Mark Lost
                        </button>
                        <button
                          className="action-btn purple sm"
                          onClick={() => updateStatus(item._id, "Returned")}
                          disabled={item.status === "Returned"}
                        >
                          Set Returned
                        </button>
                        <button
                          className="action-btn red sm"
                          onClick={() => requestDelete(item._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {viewMode === "details" && (
              <div className="detail-grid">
                {filteredItems.map(item => (
                  <div key={item._id} className="glass detail-card">
                    <div className="detail-fields">
                      <div><span className="field">Item Name:</span> <strong>{item.name || "-"}</strong></div>
                      <div><span className="field">Type:</span> <span className={`status-text ${item.status?.toLowerCase()}`}>{item.status}</span></div>
                      <div><span className="field">Category:</span> {item.category || "-"}</div>
                      {item.description ? <div><span className="field">Description:</span> {item.description}</div> : null}
                      <div><span className="field">Address:</span> {item.location || "-"}</div>
                      <div><span className="field">Contact:</span> {item.contact || "-"}</div>
                      <div><span className="field">Date:</span> {item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}</div>
                      {item.claimStatus ? <div><span className="field">Claim:</span> {item.claimStatus}</div> : null}
                    </div>
                    <div className="detail-image">
                      {item.image ? (
                        <img src={srcFor(item.image)} alt={item.name} />
                      ) : (
                        <div className="img-placeholder">{(item.name || "?").slice(0,1)}</div>
                      )}
                    </div>
                    <div className="detail-actions">
                      <button
                        className="action-btn green sm"
                        onClick={() => updateStatus(item._id, "Found")}
                        disabled={item.status === "Found" || item.status === "Returned"}
                      >
                        Mark Found
                      </button>
                      <button
                        className="action-btn blue sm"
                        onClick={() => updateStatus(item._id, "Lost")}
                        disabled={item.status === "Lost" || item.status === "Returned"}
                      >
                        Mark Lost
                      </button>
                      <button
                        className="action-btn purple sm"
                        onClick={() => updateStatus(item._id, "Returned")}
                        disabled={item.status === "Returned"}
                      >
                        Set Returned
                      </button>
                      <button
                        className="action-btn red sm"
                        onClick={() => requestDelete(item._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>

      {detailItem && (
        <div className="modal-backdrop" onClick={() => setDetailItem(null)}>
          <div className="glass details-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="details-header">
              <h3 style={{ margin: 0 }}>{detailItem.name}</h3>
              <button className="action-btn sm" onClick={() => setDetailItem(null)}>✕</button>
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
                <div className="row"><strong>Contact:</strong> {detailItem.contact || "-"}</div>
                {detailItem.description && <div className="row"><strong>Description:</strong> {detailItem.description}</div>}
                {detailItem.claimStatus && <div className="row"><strong>Claim:</strong> {detailItem.claimStatus}</div>}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
