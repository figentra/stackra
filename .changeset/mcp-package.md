---
"@stackra/mcp": minor
---

Add `@stackra/mcp`, the local developer MCP of ADR 0282: `parseMcpConfig` and `renderMcpJson` check a `.mcp.yaml`
(kebab-case server names; a `$NAME` secret only after `stackra mcp exec --`, never in env or a remote server; npx
packages pinned to an exact version) and render the `.mcp.json` Claude Code reads, with `syncMcpConfig` and
`checkMcpConfig` behind `stackra mcp sync` and `stackra agents check`; `mcpExecCommand` and `execWithSecrets` start a
server under `infisical run` so its shell expands each secret without the value passing through Stackra; and
`serveLocalMcp`, the stdio server behind `stackra mcp`, offers the `manifest`, `new`, `gen`, `validate` and `verify`
tools (every command through the CLI's runner) and proxies the local Encore tools under `encore_`.
