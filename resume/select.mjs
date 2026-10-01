// Shared by the review page and build.mjs: pick one variant's view of master.yaml.
// draft=false (the PDF view) keeps only bullets whose status is `verified`.
export function selectVariant(master, variants, key, { draft = false } = {}) {
  const v = variants[key] ?? variants.master;
  const shown = (b) => !b.hidden && (draft || b.status === 'verified');
  const fams = v.families ?? null;
  const excluded = new Set(v.exclude ?? []);
  const hit = (families) => !fams || (families ?? []).some((f) => fams.includes(f));
  const ordered = (items, order) => {
    if (!order) return items;
    const rank = (id) => (order.includes(id) ? order.indexOf(id) : order.length);
    return [...items].sort((a, b) => rank(a.id) - rank(b.id));
  };

  const sections = (v.sections ?? master.sections.map((s) => s.id))
    .map((id) => master.sections.find((s) => s.id === id))
    .filter(Boolean)
    .map((s) => {
      if (s.kind === 'skills') {
        return { ...s, lines: (s.lines ?? []).filter((l) => hit(l.families) && !excluded.has(l.id)) };
      }
      const entries = ordered(s.entries ?? [], v.order?.[s.id])
        .filter((e) => !excluded.has(e.id))
        .map((e) => {
          const bullets = (e.bullets ?? [])
            .filter((b) => shown(b) && hit(b.families) && !excluded.has(b.id))
            .slice(0, v.maxBullets?.[e.id] ?? v.maxBulletsPerEntry ?? Infinity);
          return { ...e, bullets, keep: !(e.bullets ?? []).length || bullets.length > 0 };
        })
        .filter((e) => e.keep);
      return { ...s, entries };
    })
    .filter((s) => (s.kind === 'skills' ? s.lines.length : s.entries.length));

  return { key: variants[key] ? key : 'master', headline: v.headline, person: master.person, sections };
}
