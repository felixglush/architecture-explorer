---
name: architecture-explorer
description: Create or update an interactive, source-backed architecture overview of a repository, including components, service boundaries, code/state inspection and optional execution walkthroughs. Use when asked to diagram or explore a codebase.
---

# Architecture explorer

You are the repository analyst. The bundled React Flow renderer is independent of
the repository and of the agent running this skill. Read the target repository's
instructions before editing it. Read `references/repository-review.md` for the
required source-analysis workflow and visual acceptance criteria.

## Create a canvas

Locate this SKILL.md on disk. All paths below are relative to its directory, so the
same workflow works from a Claude plugin cache or a Codex skill installation.

1. Read `renderer/src/core/types.ts`, `renderer/src/core/validate.ts` and
   `renderer/docs/modularity.md`. They define the canonical typed contracts.
2. For a new canvas, run `node <skill-directory>/scripts/init.mjs init <target-repo>/architecture`.
   The destination must not exist. The scaffold includes all frontend code and a
   lockfile; it makes no network requests and does not start the target application.
   If a canvas already exists, inspect its contracts and update its adapter in place.
   Do not overwrite or silently upgrade an existing canvas.
3. In the generated directory run `npm ci` (Node 24+; dependency downloads require
   network access). Edit `src/project.ts` to export the target's ArchitectureProject.
   Put project-specific metadata and interpretation under `src/projects/<name>/`.
   Keep shared UI/core free of domain imports and project-ID conditions.
4. Complete the repository review before choosing nodes. Do not reuse example
   components as a template for the target architecture. Read entry points, manifests, representative use cases, persistence and external
   integrations. Trace actual calls and authoritative state changes. Choose useful
   component/service boundaries, an overview, and focused views.
5. Add stable IDs and source definitions with actual paths, symbols, languages,
   matching line ranges and bundled code. Prefer revision-pinned URLs if available.
   External/unindexed components can have no sources. Unsupported languages render
   as plaintext; do not claim syntax highlighting or extraction that is unavailable.
6. Describe directed relationships, triggers and failure behavior using source
   evidence. Distinguish calls, dependencies and messages through connection kinds.
   Schemas and examples are optional. Cite relevant source paths/symbols in connection
   descriptions and label any inference. Missing state evidence does not mean stateless.
7. Add replay only when useful. Normalize evidence in the project adapter. Trace
   node/edge IDs must resolve to the document. State, metrics, recorded I/O, import
   and export are optional capabilities. Projections must never look beyond the
   selected event. Do not invent runtime evidence to populate UI panels.
8. If using a hypothetical example flow, explicitly label its title/badge/provenance
   as illustrative and explain that it was not captured from execution. Never present
   predicted decisions/state changes as observed facts. Recorded flows must identify
   their evidence source and any redaction. Replay does not run the target application.

Only bundle shareable code and evidence. Do not embed secrets or private logs, and
do not run paid models/services merely to create a walkthrough.

## Verify and deliver

Run `npm run check`, `npm run format:check`, `npm run build`, and appropriate browser
tests inside the generated directory. `App` validates references on mount; this is
not an arbitrary-JSON upload parser. Adapters are trusted, reviewed application code.
Preserve the bundled canvas design and interactions; adapt its data and capabilities
to the repository rather than redesigning the frontend. Write ANALYSIS.md with source
coverage and provenance as described in the review guide. Add a project browser test covering source navigation, connections, unavailable state,
and any replay. Existing fixture tests expect the starter projects: adapt their host
selection to the new project rather than leaving tests pointed at removed examples.

`dist/index.html` bundles the renderer, source snapshots and project evidence into one
file. Open it locally or publish it through the target's authorized static hosting.
The generated artifact needs no Node installation or application server to view.
Report evidence coverage, illustrative versus recorded flows, and checks actually run.

## Maintain and upgrade

Keep the target repository's AGENTS.md/CLAUDE.md (whichever it uses) pointing to the
adapter and verification commands. Update source snapshots, boundaries, schemas and
flow mappings when their backing code changes. Increment document version when its
structure changes. No target-language extractor is assumed.

The scaffold is a versioned source copy. For upgrades, generate into a separate new
folder and review the renderer diff before applying it; preserve the project's adapter
and custom tests. Updating this installed skill does not silently update existing canvases.


## Detail levels

Author one canonical graph with progressively disclosed structure. Missing `detail`
means Overview; use `detail: "implementation"` for supporting modules/stores and
`detail: "code"` for actual source-backed functions/classes. Give each detailed node
an owning `parent` at a strictly coarser level in the same service. Code nodes must
have source references. Prefer a small overview that explains the main flow; only
add levels justified by repository evidence. Do not invent internals to fill levels.

Connections can reference detailed endpoints: the renderer projects them to visible
owners when collapsed, omits collapsed internal edges, and preserves original IDs
for inspection and replay. Include descendants in applicable focus presets. Detail
is cumulative and independent of Focus; changing levels retains selection and
replay cursor. Legacy implementation nodes without parents remain supported but
cannot project onto an owner. New adapters should always supply owners.

Validate meaningful structure and source links at every supported level, and replay
the same flow through each. Clearly distinguish observed execution from synthetic
walkthroughs. The bundled webhook, LLM limiter and URL shortener are examples of
adapter authoring, not required architecture templates for other repositories.


## Guided flow narration

The replay's **Step guide** uses each event's `trace.title`, `trace.body`, `nodes`
and `edges` to explain the flow beside the canvas. Write concise, evidence-backed
step titles and explanations of what moves, what changes, and why. Reference actual
connection IDs and give connections useful descriptions. Provide snapshots and
input/output payloads only when supported by evidence; missing state is shown as
unavailable. There is no separate tour schema or duplicate step sequence to maintain.
