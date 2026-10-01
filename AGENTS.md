# Maintaining Architecture Explorer

The distribution serves Codex and Claude. Keep agent-specific installation separate
from the shared skill, renderer and versioned document/replay contracts. Do not add
project-specific branches or imports to shared UI/core. `src/project.ts` and
`src/main.tsx` are composition roots. New project semantics belong in adapters.

After packaging changes run `npm test`; after renderer changes also run `npm run check`,
`npm run build` and `npm run test:browser`. Verify the packed archive can scaffold and
build without the development checkout. Never package node_modules, private traces,
credentials or Station Control fixtures. Preserve third-party license notices.

Update README, skill instructions, manifests and version metadata with installation
or CLI changes. Do not claim an agent has discovered the plugin unless exercised
in that agent; filesystem packaging tests alone do not prove host discovery.
Generated canvases are explicit source copies; upgrades require review.

Use native marketplace installation as the README default. Keep the portable root
manifest, Codex catalog and Claude catalog consistent and included in the archive.
Local loading and the skill-copy helper belong in docs/distribution.md.
