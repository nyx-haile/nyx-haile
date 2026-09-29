# Resume

One sourced fact base, several tailored views, and a vamper review loop:
pick an element on the rendered page, comment, and an agent fixes the source.

| File | Role |
| --- | --- |
| `master.yaml` | Every entry and bullet, each with a stable `id`, role `families`, and the `source` that supports it |
| `variants.yaml` | Per-variant headline, section order, family filter, and exclusions |
| `select.mjs` | The one rule for turning master + variant into a view (used by the page and the PDF build) |
| `web/` | Review page: `?v=<variant>`; every section, entry and bullet carries its YAML id as its DOM id |
| `build.mjs` | Writes `out/<variant>.tex` and `.pdf` with `resume_common.tex`; `--check` fails on overflow, extra pages, or bullets missing from the PDF text layer |

## Build

```sh
npm ci
npm run build:pdf        # all variants -> out/
npm run check            # same, plus layout and text-layer checks
```

## Review loop (vamper flow)

1. Start the loopback annotation store (Agentation 3.0.2 + MCP 1.2.0, the
   hardened compose from Partial's `tools/ux-review/agentation/`), with this
   page's origin allowed and the store kept outside any repository:

   ```sh
   cd ~/build/partial/tools/ux-review/agentation
   AGENTATION_ALLOWED_ORIGINS=http://127.0.0.1:5173,http://localhost:5173 \
     docker compose -p resume-review -f compose.yaml \
     -f ~/private/resume/agentation.override.yaml up -d
   ```

2. `npm run dev` and open `http://127.0.0.1:5173/?v=master`.
3. Use the Agentation toolbar to select elements and comment. Comments sync
   to the store.
4. A Claude Code session in this repository (MCP server `agentation`,
   `http://127.0.0.1:4747/mcp`) watches pending annotations, maps each
   element id to its `master.yaml` node, edits only that node, rebuilds, and
   resolves the annotation with a reply describing the change. A request for a
   claim that no source supports is answered with a question, never invented.
5. The page reloads on every YAML edit. Re-review and repeat.

Review comments and round receipts stay outside this public repository.

## Integrity

Visible text only: no hidden or microscopic text, no instructions aimed at
parsers or screeners, and no claim without a `source`. Stated limitations
(exploratory work, failed evaluation gates) stay stated.
