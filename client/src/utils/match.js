export function tokenize(s = "") {
  return new Set(String(s).toLowerCase().split(/\W+/).filter(Boolean));
}
export function similarity(a = "", b = "") {
  const ta = tokenize(a);
  const tb = tokenize(b);
  const inter = [...ta].filter(x => tb.has(x)).length;
  const union = new Set([...ta, ...tb]).size || 1;
  return inter / union;
}
export function rankMatches(target, candidates, threshold = 0.35, limit = 5) {
  const scored = candidates.map(i => ({
    ref: i,
    score:
      0.4 * similarity(target.name, i.name) +
      0.25 * similarity(target.category, i.category) +
      0.2 * similarity(target.location, i.location) +
      0.15 * similarity(target.description || "", i.description || "")
  }));
  return scored.filter(x => x.score >= threshold).sort((a, b) => b.score - a.score).slice(0, limit);
}
