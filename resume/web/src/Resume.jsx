import { Fragment, useLayoutEffect, useRef, useState } from 'react';

// Every reviewable node carries its YAML id as the DOM id, so an Agentation
// element path resolves to exactly one node in master.yaml.
const target = (id) => ({ id, 'data-review-target': id });
// LaTeX renders `--` as an en dash; mirror that on the page.
const dash = (t) => (t ?? '').replace(/--/g, '–');

// US Letter at CSS 96 dpi, less the 0.45in padding set on `.page` in styles.css.
const CONTENT_HEIGHT = (11 - 2 * 0.45) * 96;

// The document as an ordered list of unbreakable blocks.
function toBlocks(view) {
  const blocks = [{ key: 'header', kind: 'header' }];
  for (const s of view.sections) {
    blocks.push({ key: `s:${s.id}`, kind: 'section', s });
    if (s.kind === 'skills') {
      blocks.push({ key: `k:${s.id}`, kind: 'skills', s });
      continue;
    }
    for (const e of s.entries) {
      blocks.push({ key: `e:${e.id}`, kind: 'entry', s, e });
      for (const b of e.bullets) blocks.push({ key: `b:${b.id}`, kind: 'bullet', s, e, b });
    }
  }
  return blocks;
}

// Greedy fill; a section or entry heading never ends a page.
function paginate(blocks, heights) {
  const pages = [[]];
  let used = 0;
  blocks.forEach((blk, i) => {
    const h = heights[blk.key] ?? 0;
    const heading = blk.kind === 'section' || blk.kind === 'entry';
    const next = blocks[i + 1];
    const need = heading && next ? h + (heights[next.key] ?? 0) : h;
    if (used > 0 && used + need > CONTENT_HEIGHT) {
      pages.push([]);
      used = 0;
    }
    pages[pages.length - 1].push(blk);
    used += h;
  });
  return pages;
}

function Header({ person, headline, ids }) {
  return (
    <header {...(ids ? target('person') : {})} data-review-boundary="resume.header">
      <h1>{person.name}</h1>
      {headline && <p className="headline" {...(ids ? target('headline') : {})}>{headline}</p>}
      <p className="contact">
        {person.contact.map((c, i) => (
          <span key={c.label}>
            {i > 0 && ' | '}
            {c.url ? <a href={c.url}>{c.label}</a> : c.label}
          </span>
        ))}
      </p>
    </header>
  );
}

function SectionTitle({ s, ids }) {
  return (
    <div className="section-title" {...(ids ? target(`section-${s.id}`) : {})}>
      <h2>{s.title}</h2>
      {s.note && <p className="note">{s.note}</p>}
    </div>
  );
}

function EntryHead({ e, ids }) {
  const title = e.url ? <a href={e.url}>{e.title}</a> : e.title;
  return (
    <div className="entry-head" {...(ids ? target(e.id) : {})}>
      <div className="row">
        <strong>
          {title}
          {e.visibility === 'private' && <em className="private"> (private)</em>}
          {e.stack && <span className="stack"> | {e.stack}</span>}
        </strong>
        <span className="right">{dash(e.right)}</span>
      </div>
      {(e.subtitle || e.location) && (
        <div className="row sub">
          <em>{e.subtitle}</em>
          <em>{e.location}</em>
        </div>
      )}
    </div>
  );
}

function Bullet({ b, ids }) {
  return (
    <li {...(ids ? target(b.id) : {})} className={`status-${b.status}`} title={b.note ?? b.source}>
      {dash(b.text)}
      {b.status !== 'verified' && <span className="badge">{b.status}</span>}
    </li>
  );
}

function Skills({ s, ids }) {
  return (
    <p className="skills">
      {s.lines.map((l) => (
        <span key={l.id} {...(ids ? target(l.id) : {})}>
          <strong>{l.label}:</strong> {l.items}{' '}
        </span>
      ))}
    </p>
  );
}

// Render a run of blocks with the document's real nesting: sections contain
// entries, entries contain one list of bullets.
function Flow({ blocks, view, ids, mark }) {
  const sections = [];
  for (const blk of blocks) {
    if (blk.kind === 'header') {
      sections.push({ header: blk });
      continue;
    }
    let sec = sections[sections.length - 1];
    if (!sec || sec.header || sec.s.id !== blk.s.id) sections.push((sec = { s: blk.s, items: [] }));
    if (blk.kind === 'section' || blk.kind === 'skills') sec.items.push({ blk });
    else {
      let ent = sec.items[sec.items.length - 1];
      if (!ent || !ent.e || ent.e.id !== blk.e.id) sec.items.push((ent = { e: blk.e, head: null, bullets: [] }));
      if (blk.kind === 'entry') ent.head = blk;
      else ent.bullets.push(blk);
    }
  }
  const m = (blk) => (mark ? { 'data-blk': blk.key } : {});
  return sections.map((sec, i) =>
    sec.header ? (
      <div key="header" {...m(sec.header)}>
        <Header person={view.person} headline={view.headline} ids={ids} />
      </div>
    ) : (
      <section key={`${sec.s.id}:${i}`} data-review-boundary={`resume.${sec.s.id}`}>
        {sec.items.map((it, j) =>
          it.blk ? (
            <div key={it.blk.key} {...m(it.blk)}>
              {it.blk.kind === 'section' ? <SectionTitle s={sec.s} ids={ids} /> : <Skills s={sec.s} ids={ids} />}
            </div>
          ) : (
            <article key={`${it.e.id}:${j}`} className={it.head ? 'entry' : 'entry continued'}>
              {it.head && (
                <div {...m(it.head)}>
                  <EntryHead e={it.e} ids={ids} />
                </div>
              )}
              {it.bullets.length > 0 && (
                <ul>
                  {it.bullets.map((blk) => (
                    <Fragment key={blk.key}>
                      {mark ? (
                        <li data-blk={blk.key} className={`status-${blk.b.status}`}>
                          {dash(blk.b.text)}
                          {blk.b.status !== 'verified' && <span className="badge">{blk.b.status}</span>}
                        </li>
                      ) : (
                        <Bullet b={blk.b} ids={ids} />
                      )}
                    </Fragment>
                  ))}
                </ul>
              )}
            </article>
          ),
        )}
      </section>
    ),
  );
}

export function Resume({ view }) {
  const blocks = toBlocks(view);
  const measureRef = useRef(null);
  const [heights, setHeights] = useState(null);

  useLayoutEffect(() => {
    const measure = () => {
      const root = measureRef.current;
      if (!root) return;
      const els = [...root.querySelectorAll('[data-blk]')];
      const tops = els.map((el) => el.getBoundingClientRect().top);
      const end = root.querySelector('.measure-end').getBoundingClientRect().top;
      const h = {};
      els.forEach((el, i) => (h[el.dataset.blk] = (tops[i + 1] ?? end) - tops[i]));
      setHeights(h);
    };
    measure();
    document.fonts?.ready.then(measure);
  }, [view]);

  return (
    <>
      <div
        className="page measure"
        ref={measureRef}
        aria-hidden="true"
        // Inline so it is never visible or clickable, even mid hot-update before CSS lands.
        style={{ position: 'absolute', left: -10000, top: 0, height: 'auto', visibility: 'hidden', pointerEvents: 'none' }}
      >
        <Flow blocks={blocks} view={view} ids={false} mark />
        <div className="measure-end" />
      </div>
      {heights &&
        paginate(blocks, heights).map((page, i) => (
          <main key={i} className="page" data-variant={view.key} data-page={i + 1}>
            <Flow blocks={page} view={view} ids />
          </main>
        ))}
    </>
  );
}
