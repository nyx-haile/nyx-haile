import { readFileSync } from 'node:fs';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { parse } from 'yaml';
import { defineConfig } from 'vite';

const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCES = ['master.yaml', 'variants.yaml'].map((f) => path.join(ROOT, f));

// Serves master.yaml + variants.yaml as `virtual:resume`; any edit reloads the page.
function resumeData() {
  const id = '\0virtual:resume';
  return {
    name: 'resume-data',
    resolveId: (source) => (source === 'virtual:resume' ? id : null),
    load(source) {
      if (source !== id) return null;
      SOURCES.forEach((f) => this.addWatchFile(f));
      const [master, base] = SOURCES.map((f) => parse(readFileSync(f, 'utf8')));
      const overlay = process.env.RESUME_VARIANTS;
      if (overlay) this.addWatchFile(overlay);
      const variants = { ...base, ...(overlay ? parse(readFileSync(overlay, 'utf8')) : {}) };
      return `export const master = ${JSON.stringify(master)};\nexport const variants = ${JSON.stringify(variants)};`;
    },
    handleHotUpdate({ file, server }) {
      if (!SOURCES.includes(file) && file !== process.env.RESUME_VARIANTS) return;
      server.moduleGraph.invalidateModule(server.moduleGraph.getModuleById(id));
      server.ws.send({ type: 'custom', event: 'resume:updated' });
      return [];
    },
  };
}

export default defineConfig({
  root: import.meta.dirname,
  plugins: [react(), resumeData()],
  server: { fs: { allow: [ROOT] } },
});
