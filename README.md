# Architecture Explorer

Ask Codex or Claude to review a codebase and turn it into an interactive architecture
canvas—with service boundaries, connections, source code, state, and optional replay.
The agent chooses the content from the code; the bundled frontend preserves the
same notebook-style design across repositories.

## Install

Install through your agent's plugin marketplace. You need Node 24+ and npm to build
a canvas; viewing the generated HTML only needs a browser.

These default-branch commands become available when [PR #1](https://github.com/felixglush/architecture-explorer/pull/1)
merges. Contributors can use the [preview instructions](docs/distribution.md).

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
example HTML. Pushing a `v*` version tag also publishes a GitHub release. It does
not deploy a website.

**Shiki** highlights code in the inspector. Its supported language grammars are
bundled for offline use; other languages display as plain text.

See [development and upgrades](docs/distribution.md) or
[the agent workflow](skills/architecture-explorer/SKILL.md).
