import { useEffect, useState, useMemo } from "react";
import { getItems } from "../services/items";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";

export default function Dashboard() {
  const [items, setItems] = useState([]);

  const loadItems = async () => {
    try {
      const data = await getItems();
      if (Array.isArray(data)) setItems(data);
    } catch (err) {
      // 
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const totalItems = items.length;
  const lostItems = items.filter(i => i.status === "Lost").length;
  const foundItems = items.filter(i => i.status === "Found").length;
  const returnedItems = items.filter(i => i.status === "Returned").length;

  const statusData = useMemo(() => ([
    { name: "Lost", value: lostItems },
    { name: "Found", value: foundItems },
    { name: "Returned", value: returnedItems },
  ]), [lostItems, foundItems, returnedItems]);

  const categoryData = useMemo(() => {
    const map = new Map();
    items.forEach(i => {
      const k = i.category || "Uncategorized";
      map.set(k, (map.get(k) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [items]);

  const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#3b82f6", "#ef4444"];

  return (
    <div className="dashboard">
      <h1 className="page-title">Dashboard</h1>

      <div className="stats">
        <div className="card glass">
          <h3>Total Reports</h3>
          <p>{totalItems}</p>
        </div>
        <div className="card glass">
          <h3>Lost</h3>
          <p>{lostItems}</p>
        </div>
        <div className="card glass">
          <h3>Found</h3>
          <p>{foundItems}</p>
        </div>
        <div className="card glass">
          <h3>Returned</h3>
          <p>{returnedItems}</p>
        </div>
      </div>

      <div className="glass" style={{ padding: 22, borderRadius: 18, marginBottom: 22 }}>
        <h3>Status Breakdown</h3>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={statusData} dataKey="value" innerRadius={60} outerRadius={100} paddingAngle={3}>
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass" style={{ padding: 22, borderRadius: 18, marginBottom: 22 }}>
        <h3>Category Distribution</h3>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="recent-box glass">
        <h3>Recent Activity</h3>

        {items.length === 0 && <p>No items reported yet.</p>}

        {items.slice(-5).reverse().map(item => (
          <div className="recent" key={item._id}>
            <div>
              <strong>{item.name}</strong>
              <br />
              <span>{item.location}</span>
            </div>

            <span className={`badge ${item.status === "Lost" ? "lost" : "found"}`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
