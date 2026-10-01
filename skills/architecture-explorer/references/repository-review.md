# From repository evidence to the canvas

Do this analysis before authoring project metadata. Do not rename the starter nodes
and call that a review. Different repositories need different components and flows.

## Discover

Read repository instructions and product docs, then inspect manifests, workspaces,
build/start commands and directories. Identify actual entry points: HTTP routes,
CLI commands, UI handlers, scheduled jobs, library exports, workers, or event consumers.
Find tests that demonstrate the intended behavior, configuration that changes paths,
and the integrations that cross process or ownership boundaries.

Trace representative entry points through concrete functions/classes to effects and
outputs. Confirm inferred relationships against implementation rather than imports
alone. Record the repository revision and any dirty source files used for snapshots.
Document unsupported, generated, external or unread portions instead of pretending
coverage is complete.

## Choose the architecture

Let the use case and ownership determine the main components. A CLI/library may
have one service; a monolith may have several logical boundaries in one process;
a distributed system may have separate deployment boundaries. Explain that distinction
in service subtitles. Do not invent a server, database, queue, actor or state machine.

For each component record its responsibility, backing symbols, owned state, inputs,
outputs and failure handling. Prefer product-meaningful names with exact code names
in the inspector. Put helper infrastructure behind the detail toggle. Keep an overview
that is readable and focused views for different paths; avoid duplicating the same
view under different labels. Modes belong only where configurations change behavior.
A single default mode is valid.

For each relationship find the call site, producer/consumer pair, interface contract,
or dependency declaration that establishes it. Identify direction, sync/async behavior,
trigger, and failure handling in the description. Schema/field definitions must match
source. Examples should be small, sanitized and explicitly illustrative. If evidence
is missing, label the uncertainty or omit the relationship.

## Explain a flow

Choose an input a reviewer would recognize. Follow it through only the components
that actually participate. Use short step titles and explain what each step does,
what data crosses the boundary, and who owns any changed state. Include an error or
branch when central to understanding the code, not just to fill the canvas.

A source-derived walkthrough is illustrative. A captured trace is recorded. Never
mix these labels. Keep each replay event's trace IDs aligned with the canvas and
show payloads only when meaningful. Use highlights for evidenced decisions, including
non-AI decisions; do not add AI classifications to a repository that has none.

If there is no useful execution flow (for example a declaration-only package), deliver
a static overview. Don't fabricate replay, state, metrics or I/O to satisfy a template.

## Preserve the product design

Use the bundled App and styles unchanged by default. They preserve the existing
architecture explorer's light field-notebook design, React Flow navigation, service
boundaries, orthogonal routes, progressive detail, code/state/I/O inspector and
expandable replay panel. Adapt metadata, source snapshots, focused views and capabilities
to the repository. Do not generate a new dashboard or replace the canvas with Mermaid,
an SVG or a table.

Inspect the rendered result: ensure cards and arrows have space, overview/focus views
are understandable, selected code is readable, source lines match, and each replay
step highlights the right components/connections. Verify desktop and small screens.

## Deliver the evidence

Alongside the adapter and HTML, write a brief `ANALYSIS.md` in the generated canvas:
revision analyzed; entry points inspected; mapping of components/relationships to
source symbols; chosen boundaries and focus views; flow provenance; unresolved areas;
and checks actually run. Keep this human-readable and do not invent a new runtime
schema for the report. Update it when the diagram's interpretation changes.

Read the code before drawing, validate references, begin with a readable overview,
reveal detail progressively, and show concrete sample traffic.
