# Plan: `@stackra/mcp` wave 2

**Spec**: `.agents/specs/sta-348-mcp/spec.md`

1. **Config** (`src/core/`): one zod schema with the `.mcp.json` shape, so the rendered file is the parsed document;
   `ruleIssues` adds the three rules a shape cannot say; `parseMcpConfig` runs both; `mcpConfigJsonSchema` derives the
   editor schema from the same constant.
2. **Exec** (`src/core/`): `shellCommandLine` single-quotes literals and leaves `"${NAME:?…}"` for the shell;
   `mcpExecCommand` wraps it in `infisical run … -- sh -c` only when a `$NAME` appears (the shape of the repository's
   `tools/scripts/mcp.sh`, without `eval`). `execWithSecrets` (`./node`) spawns it with inherited stdio.
3. **Files** (`src/node/`): `readMcpConfig`, `syncMcpConfig` (write only on change), `checkMcpConfig` (exact text).
4. **Server** (`src/node/`): `connectMcp` frames newline-delimited JSON-RPC both ways and is used for the server and
   the Encore client; `serveLocalMcp` answers `initialize`, `ping`, `tools/list` and `tools/call`, checks tool
   arguments with zod before anything runs, runs commands through the `StackraRunner` option (default
   `spawnStackra`), and forwards `encore_*` calls to `openEncoreMcp`'s peer (app id from the root runway).
5. **Stand-in barrels and authored tool configs** until gen writes them (STA-339), as in wave 1.
