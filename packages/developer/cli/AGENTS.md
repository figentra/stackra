# AGENTS — @stackra/cli

<!--
Stackra file contract:
Purpose: the agent rules of @stackra/cli: where code goes, the package rules (gen's passes included) and the rules
         that fail the build.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0083; ADR 0282; ADR 0294; ADR 0260 (a cycle between services is allowed at the manifest level).
-->

The `stackra` binary (ADR 0083, 0282). Member at `packages/developer/cli` (`tier:lib`), in the programming model v3.1
shape (ADR 0294, 0305). No code entry: the package ships `bin.stackra` (`src/node/stackra.ts`) only.

## Where code goes

| You are writing…                         | It goes in…                                                        |
| ---------------------------------------- | ------------------------------------------------------------------ |
| A command                                | `src/node/constants/<name>-command.constant.ts`, then `COMMANDS`   |
| A `stackra check` phase                  | `src/node/constants/<name>-phase.constant.ts`, then `CHECK_PHASES` |
| A repository check (pure, file-based)    | `@stackra/repo-checks`, called from its phase                      |
| A member tool for a layout or target     | `resolveTool` in `src/node/functions/resolve-tool.function.ts`     |
| Parsing, dispatch, processes, file reads | `src/node/functions/<name>.function.ts`                            |
| A `stackra new` template                 | `src/node/functions/<kind>-template.function.ts`, pure text        |
| Seed-pack reading and planning           | `src/node/functions/` (`readSeedPack`, `planSeed`), pure           |
| Errors and types                         | `src/node/{errors,types}/`                                         |
| A test                                   | `__tests__/<name>.<kind>.test.ts` beside it                        |

## This package

- Commands do their work through the owning package (`@stackra/gen`, `@stackra/mcp`); the CLI parses, prints and
  maps outcomes to exit codes (0, 1, 2 usage, 127 cannot start). It never re-implements gen.
- `stackra gen` orders gen's passes over the members (STA-1232): pass 1 `generate(root, { pass: "manifests" })` for
  every member, then pass 2 in rounds (the refused members and those with `.stackra/gen/clients`) until a round
  writes nothing; only the last round's refusals print. `--manifests` is pass 1 alone; `--check` is one pass 2 round.
- `stackra check` phases return findings and never print them; `runCheck` prints. A phase whose tool cannot start
  returns `skipped: "not installed"`, and a tool that fails without a parsable finding gives one `exit` finding, so a
  failure is never silent. `validate`, `verify`, `code:check` and `code:fix` are `checkCommand` presets, not new code.
- Every command writes through its `CliIo`, never `console` or `process.stdout`: `stackra mcp` runs commands with a
  capturing io because standard output carries the protocol.
- Tools start without a shell; a secret value never passes through this process (`mcp exec` names a location only).
- A seed pack, a template or a command never holds a business value (a price, a rate, a country rule): those are rows
  in the product's seed pack, each citing its answer id. A seed run never writes a record a tenant changed.
- Never add a Figentra-internal operation (Linear, bot identities, merge, secrets inbox, delegation, spend): ADR 0282
  decision 4.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.

## PII

None. The CLI runs developer tools over source code and manifests; it handles no personal data and no secret value.
