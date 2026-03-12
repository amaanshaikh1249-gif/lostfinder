import { useEffect, useState } from "react";
import { getUserDashboard, getItems } from "../services/items";
import { API_BASE, BASE_URL } from "../config";

export default function UserDashboard() {

  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
  const [claimSearch, setClaimSearch] = useState("");
  const [claimStatus, setClaimStatus] = useState("All");
  const [claimSort, setClaimSort] = useState("Newest");

  const loadDashboard = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user")) || null;
      const email = user?.email || localStorage.getItem("userEmail");

      if (!email) return;

      const data = await getUserDashboard(email);
      setClaims(data.claims || []);

      const list = await getItems();
      setItems((list || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setLoading(false);
    } catch (err) {
      // Silent fail
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) return <h2>Loading dashboard...</h2>;

  const user = JSON.parse(localStorage.getItem("user")) || null;
  const me = (user?.email || localStorage.getItem("userEmail") || "").trim();
  let emails = [me];
  try {
    const arr = JSON.parse(localStorage.getItem("user:emails") || "[]");
    emails = Array.from(new Set([me, ...arr].filter(Boolean)));
  } catch {}

  return (
    <div>

      <h1 className="page-title">👤 My Dashboard</h1>

      {/* ⭐ My Items — now first */}
      <div style={{ marginTop: 4 }}>
        <h2 style={{ marginBottom: 10 }}>✨ My Items</h2>
        <div className="filter-bar dark-chrome">
          <input
            className="premium-search"
            placeholder="Search items, location, description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="premium-select" value={status} onChange={e => setStatus(e.target.value)}>
            <option>All</option>
            <option>Lost</option>
            <option>Found</option>
            <option>Returned</option>
          </select>
          <select className="premium-select" value={category} onChange={e => setCategory(e.target.value)}>
            <option>All</option>
            <option>Accessories</option>
            <option>Vehicle</option>
            <option>ID</option>
            <option>Electronics</option>
          </select>
        </div>
        <div className="cards-grid">
          {items
            .filter(i => emails.includes(i.email) || emails.includes(i.claimedBy))
            .filter(i => {
              const q = search.toLowerCase().trim();
              const matchesQ = !q || [i.name, i.category, i.location, i.description].filter(Boolean).some(s => String(s).toLowerCase().includes(q));
              const matchesStatus = status === "All" || i.status === status;
              const matchesCat = category === "All" || i.category === category;
              return matchesQ && matchesStatus && matchesCat;
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 12)
            .map(item => (
              <div key={item._id} className="glass item-card2">
                {item.image ? (
                  <img className="item-img" src={(item.image || "").startsWith("http") ? item.image : `${BASE_URL}${item.image}`} alt={item.name} />
                ) : (
                  <div className="item-img placeholder">{(item.name || "?").slice(0,1)}</div>
                )}
                <div className="item-body">
                  <div className="item-title"><strong>{item.name}</strong></div>
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
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* ⭐ My Claims — now second, with search */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ marginBottom: 10 }}>🧾 My Claims</h2>
        <div className="filter-bar dark-chrome">
          <input
            className="premium-search"
            placeholder="Search claims (item, status, contact)..."
            value={claimSearch}
            onChange={e => setClaimSearch(e.target.value)}
          />
          <select className="premium-select" value={claimStatus} onChange={e => setClaimStatus(e.target.value)}>
            <option>All</option>
            <option>Approved</option>
            <option>Pending</option>
            <option>Rejected</option>
          </select>
          <select className="premium-select" value={claimSort} onChange={e => setClaimSort(e.target.value)}>
            <option>Newest</option>
            <option>Oldest</option>
          </select>
        </div>
        <div className="cards-grid">
          {claims
            .filter(item => {
              const q = claimSearch.toLowerCase().trim();
              if (!q) return true;
              return [item.name, item.claimStatus, item.contact, item.location]
                .filter(Boolean)
                .some(s => String(s).toLowerCase().includes(q));
            })
            .filter(item => claimStatus === "All" || (item.claimStatus || "").toLowerCase() === claimStatus.toLowerCase())
            .sort((a, b) => {
              const da = new Date(a.createdAt || 0).getTime();
              const db = new Date(b.createdAt || 0).getTime();
              return claimSort === "Oldest" ? da - db : db - da;
            })
            .map(item => (
              <div key={item._id} className="glass item-card2">
                {item.image ? (
                  <img className="item-img" src={(item.image || "").startsWith("http") ? item.image : `${BASE_URL}${item.image}`} alt={item.name} />
                ) : (
                  <div className="item-img placeholder">{(item.name || "?").slice(0,1)}</div>
                )}
                <div className="item-body">
                  <div className="item-title"><strong>{item.name}</strong></div>
                  <div className="item-meta">
                    <span className="badge" style={{ opacity: .9 }}>{item.category || "—"}</span>
                    <span className={`badge ${item.claimStatus?.toLowerCase()}`}>{item.claimStatus || "Pending"}</span>
                  </div>
                  <div className="item-sub">
                    <div>{item.location || "-"}</div>
                    <div>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A"}</div>
                  </div>
                  {item.contact && (
                    <div className="item-desc">Contact: {item.contact}</div>
                  )}
                  {item.description && (
                    <div className="item-desc" style={{ marginTop: 6 }}>
                      {item.description.length > 90 ? item.description.slice(0, 90) + "…" : item.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          {claims.length === 0 && <div style={{ opacity: .8 }}>No claims yet</div>}
        </div>
      </div>

    </div>
  );
}
