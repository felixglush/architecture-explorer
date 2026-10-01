# Architecture Explorer

Explore how a codebase fits together in an interactive canvas. Ask Codex or Claude
to review a repository and map its components, service boundaries, connections,
and important flows.

- Pan and zoom through the architecture, or focus on a particular flow.
- Click a component to inspect its source code, state ownership, and input/output contracts.
- Step through an example or recorded flow to follow messages and state changes, when available.
- Share the canvas as a single HTML file that opens in a browser without a server.

## Try it

[Explore the webhook demo](https://felixglush.github.io/architecture-explorer/webhook.html?run=webhook-retry)
or [download it for offline viewing](https://github.com/felixglush/architecture-explorer/releases/latest/download/webhook.html).

Follow an event through a queue, a failed delivery, a retry, and duplicate detection.
Click components to inspect code and state. The demo uses synthetic events.

## Install

You need Node 24+ and npm to generate a canvas, plus a version of your agent that
supports plugins. Anyone viewing the generated HTML only needs a browser.

### Claude Code

Run in Claude Code:

```text
/plugin marketplace add felixglush/architecture-explorer
/plugin install architecture-explorer@architecture-explorer
```

### Codex

Run in your terminal:

```bash
codex plugin marketplace add felixglush/architecture-explorer
codex plugin add architecture-explorer@architecture-explorer
```

## Create a canvas

Start a new session in the repository you want to visualize. Select the Architecture
Explorer plugin and ask:

> Review this codebase and build an architecture canvas. Show the main components,
> their connections, and a walkthrough of an important flow.

You can narrow the request—for example, “Show how an incoming webhook reaches the
database, including retries and error handling.”

The agent reviews the source and generates `architecture/dist/index.html`. Open
that file to explore the canvas, or share it with someone reviewing the codebase.
Code snapshots and available example data are included in the file.

Replay and state snapshots depend on the evidence available in your repository.
Illustrative walkthroughs are labeled separately from recorded execution.

## Keep it current

The canvas is a snapshot of your codebase. After changing the code, ask the agent:

> Update the architecture canvas to reflect the current code and refresh its walkthroughs.

Updating the plugin does not automatically update previously generated canvases.

For contributing or customizing the renderer, see the
[development guide](docs/distribution.md).
