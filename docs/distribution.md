# Distribution and development

## Local development and unmerged previews

The README uses each agent's native marketplace installer. For a local preview,
clone the repository, check out the branch you are testing, and load it directly:

```bash
git clone https://github.com/felixglush/architecture-explorer.git
claude --plugin-dir /absolute/path/to/architecture-explorer
```

Codex can register the preview through its native marketplace command:

```bash
codex plugin marketplace add felixglush/architecture-explorer --ref YOUR_BRANCH
codex plugin add architecture-explorer@architecture-explorer
```

The standalone skill-copy helper is retained for development or hosts without
plugin support; it is not the default installation method:

```bash
node scripts/install-codex.mjs /path/to/target-repo/.agents/skills/architecture-explorer
```

## Generate without an agent

Run from the distribution checkout:

```bash
node skills/architecture-explorer/scripts/init.mjs init /path/to/target-repo/architecture
cd /path/to/target-repo/architecture
npm ci
# Edit src/project.ts and src/projects/ to describe your repository.
npm run check
npm run build
```

Open or share `dist/index.html`. All UI code and evidence are embedded; neither a
running target application nor a frontend server is required. `npm run dev` is an
optional authoring preview. `?project=http-example` selects the illustrative Go
example; the default is a TypeScript queue with a deterministic example run.

## Distribution layout

- `plugin.json`: portable plugin manifest.
- `.agents/plugins/marketplace.json`: native Codex marketplace catalog.
- `.claude-plugin/`: Claude manifest and marketplace entry.
- `skills/architecture-explorer/SKILL.md`: shared agent workflow.
- `skills/architecture-explorer/renderer/`: reusable frontend, contracts, examples,
  tests and dependency lockfile.
- `skills/architecture-explorer/scripts/`: safe scaffolding entry point.
- `scripts/install-codex.mjs`: copies that whole skill into Codex's discovery path.

`npm run pack:release` creates `architecture-explorer-0.1.1.tgz` for download or
transfer. Extract it and follow the same commands from the resulting `package/`
directory. The archive contains source and a lockfile, not node_modules. It is a
standalone distribution; no npm registry publication is configured.

## Development and upgrades

```bash
npm ci --prefix skills/architecture-explorer/renderer
npm test
npm run check
npm run build
# Install Playwright's browser, or set CHROMIUM_PATH to an existing Chromium.
cd skills/architecture-explorer/renderer
npx playwright install chromium
cd ../../..
npm run test:browser
```

CI runs these checks and uploads a source archive plus example HTML. A pushed `v*`
tag also creates a GitHub release. Versions in root package.json, plugin.json and both Claude
manifests must agree; update renderer package/lock versions for renderer releases.

The generated canvas is a source copy, deliberately independent of this repository.
To upgrade it, scaffold to a new directory and review/apply the shared renderer diff,
preserving your adapter. There is no automatic sync or runtime download.

Source interpretation is performed by the agent. This is not a universal static
analyzer, a live debugger, or an arbitrary JSON upload service. Adapters execute
trusted application code. Unknown state stays unknown; illustrative flows are
labeled separately from recorded execution.

See [the skill](../skills/architecture-explorer/SKILL.md),
[the contracts](../skills/architecture-explorer/renderer/src/core/types.ts), and
[provenance and third-party notices](../NOTICE.md).

## GitHub Pages example

In Settings → Pages, select **GitHub Actions** as the source. No `/docs` publishing
folder or Static HTML starter workflow is needed. The Distribution workflow reuses
its verified build and deploys only the renderer's `dist/` directory after a push
to `main` or a manual run on `main`. PRs build downloadable artifacts without deployment.

`dist/webhook.html` selects the synthetic webhook adapter by filename. The README
link adds `?run=webhook-retry` to open its paused walkthrough. It works under the
repository's Pages subpath; all assets are bundled. `dist/index.html` still opens
the default job-queue example. Both files work without a development server.

The `webhook-example` workflow artifact contains the standalone webhook HTML.
Deployment uses the `github-pages` environment; repository environment protection
rules may require approval. Pages updates do not publish a new plugin release.

## Source highlighting

The inspector uses Shiki with locally bundled language grammars, so highlighted
code works offline. Unsupported languages render as plain text. Preserve that
fallback and avoid introducing runtime CDN requests when adding grammars.
