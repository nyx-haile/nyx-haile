import { createRoot } from 'react-dom/client';
import { Agentation } from 'agentation';
import { master, variants } from 'virtual:resume';
import { selectVariant } from '../../select.mjs';
import { Resume } from './Resume.jsx';
import './styles.css';

const ENDPOINT = import.meta.env.VITE_AGENTATION_ENDPOINT ?? 'http://127.0.0.1:4747';
const SESSION_KEY = 'resume-review-session';

const params = new URLSearchParams(location.search);
const key = params.get('v') ?? 'master';
const draft = params.get('draft') !== '0';
const view = selectVariant(master, variants, key, { draft });

function App() {
  return (
    <>
      <nav className="variant-nav" data-review-ignore>
        {Object.keys(variants).map((k) => (
          <a key={k} href={`?v=${k}${draft ? '' : '&draft=0'}`} aria-current={k === view.key ? 'page' : undefined}>{k}</a>
        ))}
        <a href={`?v=${view.key}${draft ? '&draft=0' : ''}`} className="toggle">{draft ? 'PDF view' : 'draft view'}</a>
      </nav>
      <Resume view={view} />
      {import.meta.env.DEV && (
        <Agentation
          endpoint={ENDPOINT}
          sessionId={localStorage.getItem(SESSION_KEY) ?? undefined}
          onSessionCreated={(id) => localStorage.setItem(SESSION_KEY, id)}
        />
      )}
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
