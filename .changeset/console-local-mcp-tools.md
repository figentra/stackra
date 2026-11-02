---
"@stackra/console": minor
"@stackra/mcp": minor
---

One command definition serves the CLI, `--json` and the local developer MCP (STA-1966, ADR 0282 decision 5 as
amended).

- **Marking a tool:** `Command({ tool: true | { readOnly } })` marks a command for the local MCP.
- **`toolsOf(config, ports)`** gives each such command:
  - an MCP-safe name (`spec:status` becomes `spec_status`);
  - a JSON Schema derived from its fields (kinds, bounds, patterns, choices, required arguments);
  - an `invoke` that runs it through the same kernel with `--json` and no prompts. Values never read as flags.
- **`serveLocalMcp({ tools })`** serves these with the command's own document as `structuredContent`. One that is named
  like a built-in tool replaces it.

Tenant tools stay on the action's own path through the `ai` service (ADR 0155).
