import { useEffect, useState, useCallback } from "react";
import api from "../api";

export default function Claims() {
  const [list, setList] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [decisionReason, setDecisionReason] = useState("");

  const load = useCallback(async () => {
    const res = await api.get("/item/admin/claims");
    setList(res.data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const openReview = async (id) => {
    const res = await api.get(`/item/admin/claims/${id}`);
    setDetail(res.data);
    setOpenId(id);
    setDecisionReason("");
  };
  const closeReview = () => { setOpenId(null); setDetail(null); };

  const decide = async (status) => {
    await api.put(`/item/claim-status/${openId}`, { status, reason: decisionReason });
    closeReview(); load();
  };

  return (
    <div className="space-y-6">
      <h1 className="page-title">Claims</h1>
      <div className="glass p-4 rounded-2xl table-box">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Status</th>
              <th>Claimed By</th>
              <th>Updated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {list.map((it) => (
              <tr key={it._id}>
                <td>{it.name}</td>
                <td><span className={`badge ${it.status === "Found" ? "found" : "lost"}`}>{it.status}</span></td>
                <td>{it.claimedBy || "-"}</td>
                <td>{new Date(it.updatedAt).toLocaleString()}</td>
                <td className="btn-group">
                  <button className="action-btn blue sm" onClick={() => openReview(it._id)}>Review</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openId && detail && (
        <div className="modal-backdrop">
          <div className="glass modal" style={{ width: 720 }}>
            <div className="flex justify-between items-center">
              <h3>Claim Review</h3>
              <button className="action-btn sm" onClick={closeReview}>✕</button>
            </div>
            <div className="text-sm text-slate-400 mb-2">AI Confidence: <span style={{ color: "#38bdf8" }}>{detail.aiConfidence}%</span></div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="glass p-3 rounded-xl">
                <div className="text-slate-400 text-sm mb-1">{detail.item.status} Item</div>
                <div className="font-semibold">{detail.item.name}</div>
                <div className="text-slate-400">{detail.item.category} • {detail.item.location}</div>
                <div className="text-slate-400 mt-1">{detail.item.description}</div>
              </div>
              <div className="glass p-3 rounded-xl">
                <div className="text-slate-400 text-sm mb-1">{detail.item.status === "Found" ? "Likely Lost" : "Likely Found"}</div>
                {detail.counterpart ? (
                  <>
                    <div className="font-semibold">{detail.counterpart.name}</div>
                    <div className="text-slate-400">{detail.counterpart.category} • {detail.counterpart.location}</div>
                    <div className="text-slate-400 mt-1">{detail.counterpart.description}</div>
                  </>
                ) : (
                  <div className="text-slate-400">No close counterpart found.</div>
                )}
              </div>
            </div>
            {detail.proofs?.length > 0 && (
              <div className="mt-3">
                <div className="text-sm text-slate-400 mb-1">Proofs</div>
                <div className="flex gap-2 flex-wrap">
                  {detail.proofs.map((p, i) => (
                    <a key={i} href={p} target="_blank" rel="noreferrer" className="action-btn sm">{`Proof ${i+1}`}</a>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-3">
              <input
                className="ui-input"
                placeholder="Decision reason (optional)"
                value={decisionReason}
                onChange={e => setDecisionReason(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="action-btn red" onClick={() => decide("Rejected")}>Reject</button>
              <button className="action-btn green" onClick={() => decide("Approved")}>Approve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
