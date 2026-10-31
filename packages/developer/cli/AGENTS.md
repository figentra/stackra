# AGENTS — @stackra/cli

<!--
Stackra file contract:
Purpose: the agent rules of @stackra/cli: where code goes, the package rules (gen's passes included) and the rules
         that fail the build.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0083; ADR 0282; ADR 0294; ADR 0260 (a cycle between services is allowed at the manifest level);
                    ADR 0349 (member names); ADR 0453 (registry items).
-->

The `stackra` binary (ADR 0083, 0282). Member at `packages/developer/cli` (`tier:lib`), in the programming model v3.1
shape (ADR 0294, 0305). No code entry: the package ships `bin.stackra` (`src/node/stackra.ts`) only; `exports` holds
`./package.json` alone, so importing the package is refused (attw and the B4 smoke check that, ADR 0177 PK4).

## Where code goes

| You are writing…                           | It goes in…                                                                |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| A command                                  | `src/node/constants/<name>-command.constant.ts`, then `COMMANDS`           |
| `stackra dev --surface` (product surface)  | `src/node/dev-surface/` (its constants, functions, types, tests)           |
| A `stackra check` phase                    | `src/node/constants/<name>-phase.constant.ts`, then `CHECK_PHASES`         |
| A repository check (pure, file-based)      | `@stackra/repo-checks`, called from its phase                              |
| A member tool for a layout or target       | `resolveTool` in `src/node/functions/resolve-tool.function.ts`             |
| Parsing, dispatch, processes, file reads   | `src/node/functions/<name>.function.ts`                                    |
| A `stackra new` template                   | `src/node/functions/<kind>-template.function.ts`, pure text                |
| Seed-pack reading and planning             | `src/node/functions/` (`readSeedPack`, `planSeed`), pure                   |
| Registry item install, lock, publish check | `src/node/functions/` (`installItem`, `readItemsLock`, `checkItemPackage`) |
| Errors and types                           | `src/node/{errors,types}/`                                                 |
| A test                                     | `__tests__/<name>.<kind>.test.ts` beside it                                |

## This package

- Commands do their work through the owning package (`@stackra/gen`, `@stackra/mcp`); the CLI parses, prints and
  maps outcomes to exit codes (0, 1, 2 usage, 127 cannot start). It never re-implements gen.
- `stackra gen` orders gen's passes over the members (STA-1232): pass 1 `generate(root, { pass: "manifests" })` for
  every member, then pass 2 in rounds (the refused members and those with `.stackra/gen/clients`) until a round
  writes nothing; only the last round's refusals print. `--manifests` is pass 1 alone; `--check` is one pass 2 round.
- A docs app (`src/config/docs.config.ts`, STA-1316) is layout `docs`: every `dev|build|lint` runs gen first (lint
  included), Mintlify runs in `.stackra/site/` (`DOCS_SITE_DIR` of gen), `dev` keeps `watchDocsSite` running beside
  `mint dev`, and `lint` is `mint broken-links` then `mint a11y`. A docs app still in the old layout (`src/docs.json`)
  runs Mintlify in `src/` until its sweep.
- `stackra dev --surface <surface>` (ADR 0436 decision 6) only parses, plans and starts processes: the import map, hot
  reload and API proxy belong to the surface's bundle-mode Vite config, which reads the `DevSurface` descriptor
  (`DEV_SURFACE_FILES.descriptor`). Every origin, port and version comes from the runway files or a flag, never code.
- `stackra check` phases return findings and never print them; `runCheck` prints. A phase whose tool cannot start
  returns `skipped: "not installed"`, and a tool that fails without a parsable finding gives one `exit` finding, so a
  failure is never silent. `validate`, `verify`, `code:check` and `code:fix` are `checkCommand` presets, not new code.
- Two tools reporting the same problem on the same file is a pair in `SAME_MEANING_RULES` (later phase to the kept
  earlier one), never a special case inside a phase. A phase whose orchestrator cannot run falls back to the plain
  tool (typecheck: turbo, else `tsc --noEmit -p <member>`) rather than reporting one opaque `exit` finding.
- Every command writes through its `CliIo`, never `console` or `process.stdout`: `stackra mcp` runs commands with a
  capturing io because standard output carries the protocol.
- Tools start without a shell; a secret value never passes through this process (`mcp exec` names a location only).
  The one exception is `ops bootstrap-operator`: it reads the environment's bootstrap token from `STACKRA_OPS_TOKEN`
  and sends it only as the bearer token of its one call; never print it, log it or pass it as an argument.
- A seed pack, a template or a command never holds a business value (a price, a rate, a country rule): those are rows
  in the product's seed pack, each citing its answer id. A seed run never writes a record a tenant changed.
- `stackra new` names a member only through `memberNaming` (`--scope`, else the root runway's `product.key`, ADR
  0349 decision 2) and writes `@stackra/*` versions in the form it returns; a template never hard-codes a scope.
  Templates write nothing under `src/`, and `--over` never writes an existing file (it prints `lineDiff`), nor
  `CHANGELOG.md` or `runway.yaml`; keep both true when a template grows.
- `stackra add` reaches the registry only through a `CatalogueClient` (`httpCatalogueClient` in `COMMANDS`, a fake in
  tests), checks every tarball against its integrity, never writes outside its kind's target (ADR 0453 decision 11),
  never overwrites a target the items lock does not pin, and never prints the licence token. The registry origin is a
  setting (`registryOrigin`), never a literal in a command; the item shapes are `@stackra/skills/contracts`.
- `stackra testbed` (ADR 0484, replaces `ci-box`) starts only `aws`, `ssh`, `rsync` and `gh`, through `TestbedDeps`
  (`createTestbedDeps` in production, a fake in tests); every remote word is single-quoted. It calls only the verbs of
  the box agent contract (`testbed-agent slot|health|status|job prepare|job run|job stop`) and honours its exit codes
  (73 retry the claim, 75 another box). The decisions (heavy or light, nested-call refusal, box order, claim
  staleness, scale, fallback) are pure functions with tests. A job never falls back to the Mac; the GitHub fallback
  takes a preset and a ref, never a command.
- Never add a Figentra-internal operation (Linear, bot identities, merge, secrets inbox, delegation, spend): ADR 0282
  decision 4.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.

## PII

The CLI runs developer tools over source code and manifests. One exception: `ops bootstrap-operator` sends one email
(an operator's, from `--email`) and the environment's bootstrap token (`STACKRA_OPS_TOKEN`) in a single call; it
prints, logs and keeps neither.
