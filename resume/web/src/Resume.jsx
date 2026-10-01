// Every reviewable node carries its YAML id as the DOM id, so an Agentation
// element path resolves to exactly one node in master.yaml.
const target = (id) => ({ id, 'data-review-target': id });
// LaTeX renders `--` as an en dash; mirror that on the page.
const dash = (t) => (t ?? '').replace(/--/g, '\u2013');

function Header({ person, headline }) {
  return (
    <header {...target('person')} data-review-boundary="resume.header">
      <h1>{person.name}</h1>
      {headline && <p className="headline" {...target('headline')}>{headline}</p>}
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

function Entry({ entry }) {
  const title = entry.url ? <a href={entry.url}>{entry.title}</a> : entry.title;
  return (
    <article className="entry" {...target(entry.id)}>
      <div className="row">
        <strong>
          {title}
          {entry.visibility === 'private' && <em className="private"> (private)</em>}
          {entry.stack && <span className="stack"> | {entry.stack}</span>}
        </strong>
        <span className="right">{dash(entry.right)}</span>
      </div>
      {(entry.subtitle || entry.location) && (
        <div className="row sub">
          <em>{entry.subtitle}</em>
          <em>{entry.location}</em>
        </div>
      )}
      {entry.bullets.length > 0 && (
        <ul>
          {entry.bullets.map((b) => (
            <li key={b.id} {...target(b.id)} className={`status-${b.status}`} title={b.note ?? b.source}>
              {dash(b.text)}
              {b.status !== 'verified' && <span className="badge">{b.status}</span>}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function Resume({ view }) {
  return (
    <main className="page" data-variant={view.key}>
      <Header person={view.person} headline={view.headline} />
      {view.sections.map((s) => (
        <section key={s.id} {...target(`section-${s.id}`)} data-review-boundary={`resume.${s.id}`}>
          <h2>{s.title}</h2>
          {s.note && <p className="note">{s.note}</p>}
          {s.kind === 'skills' ? (
            <p className="skills">
              {s.lines.map((l) => (
                <span key={l.id} {...target(l.id)}>
                  <strong>{l.label}:</strong> {l.items}{' '}
                </span>
              ))}
            </p>
          ) : (
            s.entries.map((e) => <Entry key={e.id} entry={e} />)
          )}
        </section>
      ))}
    </main>
  );
}
