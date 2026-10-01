# Generated architecture canvas

Run `npm ci`, edit `src/project.ts` to select your repository adapter, then
`npm run check` and `npm run build`. Open/share the self-contained `dist/index.html`.
Use `npm run dev` for optional interactive authoring.

The starter includes a TypeScript queue and Go HTTP example. Replace them with
source-backed metadata and optional replay interpretation under `src/projects/`.
See `src/core/types.ts` and `docs/modularity.md` for the contract. Keep shared UI/core
independent of project semantics. For a new adapter, update browser tests to exercise
that project's source, connections, and any replay. Run `npm test` with Chromium
installed through Playwright or supplied by `CHROMIUM_PATH`.

Keep actual source, unknown state and illustrative flows clearly distinguished.
Do not bundle private evidence in a shareable artifact.
