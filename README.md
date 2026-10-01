# Architecture Explorer

Explore how a codebase fits together in an interactive canvas. Ask Codex or Claude
to review a repository and map its components, service boundaries, connections,
and important flows.

- Pan and zoom through the architecture, or focus on a particular flow.
- Switch detail from Overview to Implementation to Code, when the canvas provides those levels.
- Click a component to inspect its source code, state ownership, and input/output contracts.
- Step through an example or recorded flow to follow messages and state changes, when available.
- Open **Step guide** during replay for numbered steps, data routes, payloads, and available before/after state.
- Share the canvas as a single HTML file that opens in a browser without a server.

## Try it

[Explore the webhook demo](https://felixglush.github.io/architecture-explorer/webhook.html?run=webhook-retry)
or [download it for offline viewing](https://github.com/felixglush/architecture-explorer/releases/latest/download/webhook.html).

Follow an event through a queue, a failed delivery, a retry, and duplicate detection.
Click components to inspect code and state. All demos use synthetic events.

Also explore:

- [LLM rate limiter](https://felixglush.github.io/architecture-explorer/llm-rate-limiter.html?run=llm-rate-limiter): request and token quotas, rejection, token reservation, and usage reconciliation.
- [URL shortener](https://felixglush.github.io/architecture-explorer/url-shortener.html?run=url-shortener): code creation, cache misses and hits, and expiration.

**Level of detail** controls how much structure is visible: Overview shows the main
components, Implementation adds supporting modules and stores, and Code adds
source-backed functions. Hidden connections and replay highlights map to the owning
component. Your selection and replay position stay intact. **Focus** chooses which
part of the system to explore.

The two system-design examples draw on Hello Interview's
[distributed rate limiter](https://www.hellointerview.com/learn/system-design/problem-breakdowns/distributed-rate-limiter)
and [URL shortener](https://www.hellointerview.com/learn/system-design/problem-breakdowns/bitly)
articles. They are small local teaching models; the LLM quota adaptation does not
describe ChatGPT's actual implementation.

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
