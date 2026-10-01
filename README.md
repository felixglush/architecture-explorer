# Architecture Explorer

Ask Codex or Claude to review a codebase and turn it into an interactive architecture
canvas—with service boundaries, connections, source code, state, and optional replay.
The agent chooses the content from the code; the bundled frontend preserves the
same notebook-style design across repositories.

## Try the example

[Open the webhook walkthrough](https://felixglush.github.io/architecture-explorer/webhook.html?run=webhook-retry)
— explore a queue, a failed delivery, a retry, and duplicate detection. Click
components to inspect code and state, or step through the synthetic events.

This is a deterministic teaching model, not a live webhook service or production
trace. No requests are sent. The same canvas is available as the `webhook-example`
HTML artifact in [successful workflow runs](https://github.com/felixglush/architecture-explorer/actions/workflows/distribution.yml).

## Install

Install through your agent's plugin marketplace. You need Node 24+ and npm to build
a canvas; viewing the generated HTML only needs a browser.

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

## Use

Start a new session in the repository you want to visualize. Select the Architecture
Explorer plugin and ask: **“Review this codebase and build an architecture canvas.”**

The agent generates `architecture/dist/index.html`. Open it locally or share it;
no server is needed to view it.

## What ships

This GitHub repository hosts a marketplace catalog containing one plugin: the agent
skill plus its frontend. It is not published to npm or listed in a central app store.

The GitHub workflow tests and builds the plugin, then uploads a source archive and
example HTML. Pushing a `v*` version tag also publishes a GitHub release. It
also deploys the example to GitHub Pages after checks pass on `main`. PRs and
release tags do not deploy Pages.

**Shiki** highlights code in the inspector. Its supported language grammars are
bundled for offline use; other languages display as plain text.

See [development and upgrades](docs/distribution.md) or
[the agent workflow](skills/architecture-explorer/SKILL.md).
