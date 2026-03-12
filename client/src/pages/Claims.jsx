import { useEffect, useState, useCallback } from "react";
import api from "../api";
import { useToast } from "../components/toastContext";
import { BASE_URL } from "../config";
import "../styles/viewitems.css";

export default function Claims() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [decisionReason, setDecisionReason] = useState("");
  const { showToast } = useToast() || { showToast: () => {} };

  const srcFor = (img) => {
    if (!img || typeof img !== "string") return "/images/item-placeholder.svg";
    if (img.startsWith("/uploads/")) return `${BASE_URL}${img}`;
    if (img.startsWith("/images/")) return img;
    if (/^https?:\/\//.test(img)) return img;
    return "/images/item-placeholder.svg";
  };

  const load = useCallback(async () => {
    try {
      const res = await api.get("/item/admin/claims");
      setList(res.data || []);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openReview = async (id) => {
    try {
      const res = await api.get(`/item/admin/claims/${id}`);
      setDetail(res.data);
      setOpenId(id);
      setDecisionReason("");
    } catch (e) {
      showToast && showToast("Failed to load claim details", "error");
    }
  };

  const closeReview = () => { 
    setOpenId(null); 
    setDetail(null); 
  };

  const decide = async (status) => {
    try {
      await api.put(`/item/claim-status/${openId}`, { status, reason: decisionReason });
      showToast && showToast(`Claim ${status} successfully`, "success");
      closeReview(); 
      load();
    } catch (e) {
      showToast && showToast("Failed to update claim status", "error");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading claims...</div>;

  return (
    <div className="form-page">
      <h1 className="page-title">📋 Claim Management</h1>
      
      <div className="detail-grid">
        {list.length === 0 ? (
          <div className="glass p-8 rounded-2xl" style={{ textAlign: "center", gridColumn: "1 / -1", opacity: 0.7 }}>
            No pending claims to review.
          </div>
        ) : (
          list.map((it) => (
            <div key={it._id} className="glass detail-card">
              <div className="detail-fields">
                <div style={{ marginBottom: 10 }}>
                  <span className="field">Item Name:</span> 
                  <strong style={{ fontSize: "1.1rem" }}>{it.name || "-"}</strong>
                </div>
                <div><span className="field">Type:</span> <span className={`status-text ${it.status?.toLowerCase()}`}>{it.status}</span></div>
                <div><span className="field">Category:</span> {it.category || "-"}</div>
                <div><span className="field">Location:</span> {it.location || "-"}</div>
                <div><span className="field">Claimed By:</span> <strong>{it.claimedBy || "-"}</strong></div>
                <div><span className="field">Contact:</span> {it.contact || "-"}</div>
                <div><span className="field">Date:</span> {new Date(it.updatedAt).toLocaleString()}</div>
                {it.description && (
                  <div style={{ marginTop: 8, padding: 8, background: "rgba(255,255,255,0.05)", borderRadius: 8, fontSize: 13 }}>
                    <span className="field" style={{ display: "block", marginBottom: 2 }}>Description:</span>
                    {it.description}
                  </div>
                )}
              </div>
              
              <div className="detail-image">
                <img 
                  src={srcFor(it.image)} 
                  alt={it.name} 
                  style={{ cursor: "pointer" }}
                  onClick={() => openReview(it._id)}
                />
              </div>

              <div className="detail-actions" style={{ gridColumn: "1 / -1", marginTop: 16, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 16, display: "flex", justifyContent: "flex-end" }}>
                <button className="action-btn blue" onClick={() => openReview(it._id)} style={{ padding: "10px 30px", fontWeight: 700 }}>
                  Review & Decision
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {openId && detail && (
        <div className="modal-backdrop" onClick={closeReview}>
          <div className="glass modal" style={{ width: 850, maxWidth: "95vw" }} onClick={e => e.stopPropagation()}>
            <div className="details-header" style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Review Claim: {detail.item.name}</h3>
              <button className="action-btn sm" onClick={closeReview}>✕</button>
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <div className="badge purple" style={{ display: "inline-block", fontSize: 12, padding: "4px 12px" }}>
                AI Match Confidence: {detail.aiConfidence}%
              </div>
            </div>

            <div className="details-body" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Claimed Item Details */}
              <div className="glass p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 10, fontWeight: 700, letterSpacing: 0.5, color: "#3b82f6" }}>CLAIMED ITEM DETAILS</div>
                <div className="details-media" style={{ marginBottom: 12 }}>
                  <img src={srcFor(detail.item.image)} alt={detail.item.name} style={{ height: 160, width: "100%", objectFit: "cover", borderRadius: 12 }} />
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{detail.item.name}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <span className="badge" style={{ fontSize: 10 }}>{detail.item.category}</span>
                    <span className={`badge ${detail.item.status === "Lost" ? "lost" : "found"}`} style={{ fontSize: 10 }}>{detail.item.status}</span>
                  </div>
                  <div style={{ fontSize: 13 }}><span style={{ opacity: 0.6 }}>Location:</span> {detail.item.location}</div>
                  <div style={{ fontSize: 13 }}><span style={{ opacity: 0.6 }}>Contact:</span> {detail.item.contact || "N/A"}</div>
                  <div style={{ fontSize: 13 }}><span style={{ opacity: 0.6 }}>Reporter:</span> {detail.item.email}</div>
                  <div style={{ fontSize: 13 }}><span style={{ opacity: 0.6 }}>Reported:</span> {new Date(detail.item.createdAt).toLocaleString()}</div>
                  {detail.item.description && (
                    <div style={{ fontSize: 13, marginTop: 4, padding: 8, background: "rgba(255,255,255,0.05)", borderRadius: 8 }}>
                      <span style={{ opacity: 0.6, display: "block", fontSize: 11, marginBottom: 2 }}>Description:</span>
                      {detail.item.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Potential Match Details */}
              <div className="glass p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 10, fontWeight: 700, letterSpacing: 0.5, color: "#22c55e" }}>POTENTIAL SYSTEM MATCH</div>
                {detail.counterpart ? (
                  <>
                    <div className="details-media" style={{ marginBottom: 12 }}>
                      <img src={srcFor(detail.counterpart.image)} alt={detail.counterpart.name} style={{ height: 160, width: "100%", objectFit: "cover", borderRadius: 12 }} />
                    </div>
                    <div style={{ display: "grid", gap: 8 }}>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>{detail.counterpart.name}</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <span className="badge" style={{ fontSize: 10 }}>{detail.counterpart.category}</span>
                        <span className={`badge ${detail.counterpart.status === "Lost" ? "lost" : "found"}`} style={{ fontSize: 10 }}>{detail.counterpart.status}</span>
                      </div>
                      <div style={{ fontSize: 13 }}><span style={{ opacity: 0.6 }}>Location:</span> {detail.counterpart.location}</div>
                      <div style={{ fontSize: 13 }}><span style={{ opacity: 0.6 }}>Contact:</span> {detail.counterpart.contact || "N/A"}</div>
                      <div style={{ fontSize: 13 }}><span style={{ opacity: 0.6 }}>Reporter:</span> {detail.counterpart.email}</div>
                      <div style={{ fontSize: 13 }}><span style={{ opacity: 0.6 }}>Reported:</span> {new Date(detail.counterpart.createdAt).toLocaleString()}</div>
                      {detail.counterpart.description && (
                        <div style={{ fontSize: 13, marginTop: 4, padding: 8, background: "rgba(255,255,255,0.05)", borderRadius: 8 }}>
                          <span style={{ opacity: 0.6, display: "block", fontSize: 11, marginBottom: 2 }}>Description:</span>
                          {detail.counterpart.description}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ height: "100%", minHeight: 250, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.5, textAlign: "center", padding: 20 }}>
                    No matching counterpart found in the database.
                  </div>
                )}
              </div>
            </div>

            {detail.proofs?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Claimant Proofs</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {detail.proofs.map((p, i) => (
                    <a key={i} href={p} target="_blank" rel="noreferrer" className="action-btn sm blue" style={{ padding: "6px 12px" }}>
                      View Proof {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Decision Reason</div>
              <textarea
                className="ui-input"
                placeholder="Explain the reason for approval or rejection..."
                style={{ minHeight: 80, width: "100%", padding: 12 }}
                value={decisionReason}
                onChange={e => setDecisionReason(e.target.value)}
              />
            </div>

            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button className="action-btn" onClick={closeReview} style={{ padding: "8px 20px" }}>Cancel</button>
              <div style={{ flex: 1 }} />
              <button className="action-btn red" onClick={() => decide("Rejected")} style={{ padding: "8px 20px" }}>Reject Claim</button>
              <button className="action-btn green" onClick={() => decide("Approved")} style={{ padding: "8px 20px" }}>Approve Claim</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
