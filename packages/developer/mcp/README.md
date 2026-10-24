# @stackra/mcp

The local developer MCP of ADR 0282: the `.mcp.yaml` contract and the `.mcp.json` rendered from it, the launcher that
gives an MCP server its secrets without anyone reading them, and the stdio server an assistant talks to inside a
Stackra repository. `@stackra/cli` wires it to `stackra mcp`, `stackra mcp sync`, `stackra mcp exec --` and
`stackra agents check`; the package ships no binary of its own.

**Tier:** `tier:lib` (`packages/developer/mcp`). Entries `.` and `./node` (ADR 0127, 2026-10-24 note). Depends on
`@stackra/contracts`, `@stackra/runway`, zod and yaml.

## What is here

| Entry    | Symbol                                    | Use                                                                      |
| -------- | ----------------------------------------- | ------------------------------------------------------------------------ |
| `.`      | `parseMcpConfig(document, source?)`       | check a parsed `.mcp.yaml`: its shape, then the rules below              |
| `.`      | `renderMcpJson(config)`                   | the exact `.mcp.json` text Claude Code reads                             |
| `.`      | `mcpExecCommand(argv, options?)`          | the command `stackra mcp exec -- <argv>` starts                          |
| `.`      | `shellCommandLine(argv)`, `secretNamesOf` | the quoted `sh -c` line and the `$NAME` references it expands            |
| `.`      | `mcpConfigJsonSchema()`                   | the JSON Schema served at `static.stackra.figentra.com/schemas/mcp.json` |
| `.`      | `McpConfigInvalidError`                   | a `.mcp.yaml` that cannot be used, with every issue                      |
| `./node` | `syncMcpConfig(root?)`                    | `stackra mcp sync` (the template's `prepare`): write `.mcp.json`         |
| `./node` | `checkMcpConfig(root?)`                   | `stackra agents check`: is `.mcp.json` what `.mcp.yaml` renders to?      |
| `./node` | `readMcpConfig(file)`                     | read, YAML-parse and check one `.mcp.yaml`                               |
| `./node` | `execWithSecrets(argv, options?)`         | `stackra mcp exec --`: start a server with its secrets                   |
| `./node` | `serveLocalMcp(options)`                  | `stackra mcp`: the local stdio server                                    |
| `./node` | `McpProtocolError`                        | a JSON-RPC error on the connection                                       |

## `.mcp.yaml` rules

The shape is Claude Code's `.mcp.json`: `mcpServers` keyed by a kebab-case name, each a local server (`command`,
`args`, `env`) or a remote one (`type: http | sse`, `url`, `headers`). On top of the shape:

- `secret_without_exec`: a `$NAME` reference reaches a local server only as an argument after
  `stackra mcp exec --`; never in `env` or before the launcher, where it would be passed literally.
- `secret_in_remote_server`: a remote server signs in with OAuth; a `$NAME` in its URL or headers is refused.
- `unpinned_npx_server`: an npx package names an exact version (`name@1.2.3`), never `@latest` or a range.

## Secrets

`stackra mcp exec -- <argv>` starts `argv` unchanged when it names no secret. Otherwise it runs
`infisical run --env=<dev> --path=</agents> --silent -- sh -c 'exec <line>'`: Infisical puts the values into that one
process's environment, and the line, every literal single-quoted, expands each `$NAME` there and fails naming an unset
one. No value passes through the Stackra process, its output or its arguments.

```ts
import { execWithSecrets } from "@stackra/mcp/node";

process.exitCode = await execWithSecrets(argv, { environment: "dev", path: "/agents" });
```

## The local server

`serveLocalMcp` speaks MCP over stdio (newline-delimited JSON-RPC 2.0) and offers:

| Tool       | Does                                                                      |
| ---------- | ------------------------------------------------------------------------- |
| `manifest` | reads the committed `stackra.manifest.json` files, by member and section  |
| `new`      | `stackra new <kind> <name> [flags]`                                       |
| `gen`      | `stackra gen` (`--check` with `check: true`)                              |
| `validate` | `stackra validate`                                                        |
| `verify`   | `stackra verify`                                                          |
| `encore_*` | every tool of the local Encore MCP (`encore mcp run --app=<id>`), proxied |

Every command tool runs through the `run` option, so a write passes the CLI's own commands and gates; the CLI passes
its command core, and the default spawns `stackra`. The Encore app id is the root runway's `providers.encore.app`; when
there is none, or Encore does not answer within ten seconds, the local tools still work.

```ts
import { serveLocalMcp } from "@stackra/mcp/node";

await serveLocalMcp({ version: CLI_VERSION, run: (args) => commands.run(args) });
```

The hosted mode of ADR 0282 (`mcp.stackra.figentra.com`, OAuth) is a separate deployment and is not in this package.
