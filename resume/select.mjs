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
        .filter((e) => !e.hidden && !excluded.has(e.id))
        .map((e) => {
          // An entry belongs to a variant when one of its bullets matches the variant's families.
          // Its `lead` bullet (what the entry is) then always shows first, whatever its own families.
          const visible = (e.bullets ?? []).filter((b) => shown(b) && !excluded.has(b.id));
          const relevant = visible.some((b) => hit(b.families));
          const bullets = ordered(visible, v.bulletOrder?.[e.id])
            .sort((x, y) => Number(!!y.lead) - Number(!!x.lead))
            .filter((b) => b.lead || hit(b.families))
            .slice(0, v.maxBullets?.[e.id] ?? v.maxBulletsPerEntry ?? Infinity);
          return { ...e, bullets, keep: !(e.bullets ?? []).length || relevant };
        })
        .filter((e) => e.keep);
      return { ...s, entries };
    })
    .filter((s) => (s.kind === 'skills' ? s.lines.length : s.entries.length));

  return { key: variants[key] ? key : 'master', headline: v.headline, person: master.person, sections };
}
