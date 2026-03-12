 import { useEffect, useState } from "react";
import api from "../api";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [topCat, setTopCat] = useState([]);

  useEffect(() => {
    (async () => {
      const s = await api.get("/admin/analytics/summary");
      const m = await api.get("/admin/analytics/monthly");
      const c = await api.get("/admin/analytics/top-category");
      setSummary(s.data);
      setMonthly(m.data.map(d => ({ ...d, label: `${String(d.m).padStart(2,"0")}/${d.y}` })));
      setTopCat(c.data);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="page-title">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {summary && [
          { label:"Total Users", value: summary.users },
          { label:"Lost Items", value: summary.lost },
          { label:"Found Items", value: summary.found },
          { label:"Recovery Rate", value: `${summary.recoveryRate}%` },
        ].map(card => (
          <div key={card.label} className="card dark rounded-2xl p-4 border border-white/10">
            <div className="text-xs uppercase text-slate-400">{card.label}</div>
            <div className="text-2xl font-extrabold text-sky-300 mt-1">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="glass p-4 rounded-2xl">
        <div className="text-sm text-slate-400 mb-2">Monthly Reports</div>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="lostG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb7185" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#fb7185" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="foundG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="retG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c084fc" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#c084fc" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="label" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ background:"#0f172a", border:"1px solid rgba(255,255,255,0.1)" }}/>
              <Area type="monotone" dataKey="lost" stroke="#fb7185" fill="url(#lostG)" />
              <Area type="monotone" dataKey="found" stroke="#4ade80" fill="url(#foundG)" />
              <Area type="monotone" dataKey="returned" stroke="#c084fc" fill="url(#retG)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass p-4 rounded-2xl">
        <div className="text-sm text-slate-400 mb-2">Top Categories</div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topCat}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
              <XAxis dataKey="category" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ background:"#0f172a", border:"1px solid rgba(255,255,255,0.1)" }}/>
              <Bar dataKey="count" fill="#38bdf8" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
