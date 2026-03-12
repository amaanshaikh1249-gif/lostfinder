// Seed minimal dataset for demo
const base = "http://localhost:5000";
async function jfetch(url, opts = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { res, data };
}
(async () => {
  const ts = Date.now();
  const items = [
    { name: "Dell Laptop", category: "Electronics", location: "CS Lab", contact: "9999999999", email: `seed-lost1+${ts}@mail.local`, description: "Grey Dell XPS", status: "Lost" },
    { name: "Dell Laptop", category: "Electronics", location: "CS Lab", contact: "8888888888", email: `seed-found1+${ts}@mail.local`, description: "Found in Lab", status: "Found" },
    { name: "Black Wallet", category: "Accessories", location: "Library", contact: "7777777777", email: `seed-lost2+${ts}@mail.local`, description: "Leather wallet", status: "Lost" },
    { name: "Black Wallet", category: "Accessories", location: "Library", contact: "6666666666", email: `seed-found2+${ts}@mail.local`, description: "Found near desk", status: "Found" },
  ];
  for (const it of items) {
    const { res } = await jfetch(`${base}/item/add`, { method: "POST", body: JSON.stringify(it) });
    console.log(`${res.ok ? "✅" : "❌"} Seed item: ${it.name} (${it.status}) status=${res.status}`);
  }
  console.log("Seeding complete.");
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
