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
  const users = [
    { name: "Alice Doe", email: `alice+${ts}@lostfinder.local`, password: "Test@1234" },
    { name: "Bob Ray", email: `bob+${ts}@lostfinder.local`, password: "Test@1234" },
    { name: "Chris Lee", email: `chris+${ts}@lostfinder.local`, password: "Test@1234" },
  ];
  for (const u of users) {
    const { res } = await jfetch(`${base}/user/register`, { method: "POST", body: JSON.stringify(u) });
    console.log(`${res.ok ? "✅" : "❌"} Seed user: ${u.name} status=${res.status}`);
  }
  console.log("Seeding users complete.");
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
