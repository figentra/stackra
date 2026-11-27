---
"@stackra/mcp": minor
"@stackra/console": minor
"@stackra/cli": minor
---

The local developer MCP behind `stackra mcp` describes only what exists and serves real commands as tools (STA-2873).
The hand-written `LOCAL_TOOLS` table, which promised `stackra new` kinds (`module`, `action`) and manifest sections
that do not exist, is gone: every tool is now a console command declared `tool` (`DEV_TOOL_COMMANDS`) served through
`toolsOf`, so its schema, hints and handler are the command's. New tools: `app_info` (the repository's facts),
`routes` (HTTP endpoints and app pages), `check`, `test`, `typecheck` and `lint` beside `manifest`, `new`, `gen`,
`validate` and `verify`, and `@stackra/cli` adds `ls`. The runner tools return structured results (Vitest counts and
failures, TypeScript and oxlint diagnostics by file and line, gen refusals with their fix, `stackra check` findings by
phase) and take a `member` to run in. Every tool is listed with its MCP hints (`readOnlyHint`, `destructiveHint`,
`idempotentHint`); a tool that writes is refused with `deployed_target` unless `STACKRA_ENVIRONMENT` says `dev` or
`test` (an unset value is not local) and the call names no other environment, and `stackra mcp` and `stackra dev`
set `STACKRA_ENVIRONMENT=dev` themselves when it is unset; the proxied Encore tools follow `nextCursor` across every
page. `app_info` reports an unset environment as `name: null, deployed: true`.
`@stackra/console`'s `tool` option takes `destructive` and `idempotent`, and `ConsoleTool` carries both. `StackraRunner`
and the CLI's `context.cli` take an optional `{ cwd }`. `@stackra/mcp` exports the `DevToolHost` port.
