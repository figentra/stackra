# Feature Specification: `@stackra/cli` wave 3, the thin `stackra` binary

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/cli` (developer, wave 3) for real: the `stackra` binary on top of `@stackra/gen`, thin
first (gen, the member tool commands, ls), plus the `mcp` and `agents` commands `@stackra/mcp` was built for.

## Impact

- **Apps touched**: none (the template's root and member `package.json` scripts call the binary)
- **Services touched**: none
- **Packages touched**: `packages/developer/cli` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none read. `stackra mcp exec` passes a secret store location to `@stackra/mcp`, never a value
- **ADR needed**: no (ADR 0083, 0282, 0294, 0295, 0127 2026-10-24 note)
- **New dependencies**: none outside the catalogs (`yaml` from the default catalog; workspace `@stackra/gen`,
  `@stackra/mcp`, `@stackra/contracts`). Argument parsing is `node:util` `parseArgs`; no CLI framework dependency
- **Deploy modes**: same in all; developer tooling only
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/developer/cli/README.md`, `packages/developer/cli/AGENTS.md`; ADR 0083, 0120, 0127, 0282, 0294, 0295 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R2 (new public binary; starts developer tools, writes generated files through gen)
- **Branch members**: this branch (STA-348) also changes `packages/application/actions`, `packages/application/registry`, `packages/commerce/money`, `packages/commerce/pricing`, `packages/communication/versioning`, `packages/cross-cutting/seo`, `packages/data/assets`, `packages/data/filesystem`, `packages/data/model`, `packages/data/state-machine`, `packages/data/storage`, `packages/developer/coding-standard`, `packages/developer/devtools-kit`, `packages/developer/gen`, `packages/developer/mcp`, `packages/developer/renderers`, `packages/developer/runway`, `packages/developer/skills`, `packages/developer/testing`, `packages/developer/vite-plugin`, `packages/experience/platform`, `packages/experience/shortcuts`, `packages/foundation/config`, `packages/foundation/container`, `packages/foundation/contracts`, `packages/foundation/errors`, `packages/foundation/events`, `packages/foundation/i18n`, `packages/foundation/logger`, `packages/foundation/support`, `packages/foundation/transport`, `packages/foundation/validation`, `packages/runtime/app`, `packages/runtime/cache`, `packages/runtime/devices`, `packages/runtime/realtime`, `packages/security/consent`, `packages/security/csp`, `packages/security/entitlements`, `packages/security/licensing`, `packages/state/coordinator`, `packages/state/feature-flags`, `packages/state/state`, `packages/state/theming`, `packages/tooling/oxlint`; spec-trace names every member of the diff, and each sibling package has its own `sta-348-*` spec or is outside this spec's scope

## Consumer contract

The template imports no symbol from `@stackra/cli`. Its contract is the command lines its `package.json` scripts run:

| Script line                                                | Status in this wave                                   |
| ---------------------------------------------------------- | ----------------------------------------------------- |
| `stackra gen`, `stackra gen --check`                       | built                                                 |
| `stackra dev`, `stackra dev --target ios\|android`         | built                                                 |
| `stackra dev --target desktop`                             | refused with the reason (no desktop dev tool yet)     |
| `stackra build`, `stackra start`, `stackra typecheck`      | built (a service build waits for the Encore target)   |
| `stackra test`, `stackra test --tier e2e`                  | built                                                 |
| `stackra mcp sync` (`prepare`)                             | built                                                 |
| `stackra db diff\|migrate\|seed`                           | later: lands with `@stackra/database` (data wave)     |
| `stackra new`, `validate`, `verify`, `structure`, `doctor` | later: move in from `tools/scripts` (ADR 0282)        |
| `stackra infra preview`, `stackra agents setup`            | later: with the infra packages and the plugin install |

Registry row: `gen`, `dev`, `build`, `typecheck`, `test`, `lint`, `db`, `infra`, `ls`; absorbs `console`; depends on
`gen`; ships thin, then grows.

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- ADR 0083 names `@stackra/cli` the `stackra` binary; ADR 0282 decision 3 lists
  its operations and decision 4 keeps internal ones out; ADR 0127 2026-10-24 note places `cli` in `developer` and folds
  `console` into it; the build plan ships the CLI thin first and adds `stackra db` with `@stackra/database`

## User Scenarios & Testing

### User Story 1 - `stackra gen` and `--check` (Priority: P1)

**Independent Test**: `src/node/functions/__tests__/run-gen.function.test.ts`,
`src/node/constants/__tests__/gen-command.constant.test.ts`, `src/node/functions/__tests__/workspace-members.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** a member, **When** `stackra gen` runs, **Then** gen-core writes its files and the CLI lists them.
2. **Given** a refusal, **Then** it prints in gen's two-line form (location, code, subject, fix), nothing is written and
   the exit code is 1.
3. **Given** `--check` and a stale file, **Then** it lists the stale paths and exits 1; clean, it exits 0.
4. **Given** the workspace root, **Then** every member with a `stackra.config.ts` runs, in path order, and one failure
   does not stop the others.

### User Story 2 - member tool commands (Priority: P1)

**Independent Test**: `src/node/functions/__tests__/{resolve-tool,tool-command,read-member,run-process}.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** a member with `stackra.config.ts`, **When** `dev`, `build`, `start`, `typecheck` or `test` runs, **Then**
   gen runs first and a refusal stops before the tool; `lint` never runs gen.
2. **Given** an app, **Then** the tool follows its targets: Vite for web and PWA, Expo for iOS and Android, Playwright
   or Maestro for e2e; a package builds with tsdown, a worker with Wrangler, a service serves its generated Encore app,
   the docs app serves with Mintlify.
3. **Given** a generated `.stackra/<tool>` config, **Then** the tool gets `--config` for it; otherwise none.
4. **Given** an unknown target or tier, **Then** exit 2 with the usage; a task no tool serves exits 1 naming why.
5. **Given** the workspace root, **Then** the command runs `turbo run <task>` (`test:e2e` for the e2e tier).

### User Story 3 - `stackra ls` (Priority: P2)

**Independent Test**: `src/node/constants/__tests__/ls-command.constant.test.ts`.

1. **Given** a committed manifest, **Then** `ls` counts each section and `ls actions` prints one key per line.
2. **Given** the workspace root, **Then** every member's manifest is read, each line prefixed by the package name.

### User Story 4 - MCP and agent files (Priority: P1)

**Independent Test**: `src/node/constants/__tests__/{mcp,mcp-sync,mcp-exec,agents-sync,agents-check}-command.constant.test.ts`.

1. `stackra mcp` serves `@stackra/mcp`'s local server with the CLI version; its tools run the CLI in-process with a
   capturing io, so standard output carries only the protocol.
2. `stackra mcp sync` and `stackra agents sync` render `.mcp.json`; `stackra agents check` exits 1 on drift.
3. `stackra mcp exec -- <argv>` starts the server through `execWithSecrets`; an empty command is a usage error.

### User Story 5 - the command core (Priority: P1)

**Independent Test**: `src/node/functions/__tests__/{run-cli,find-command,help-text,capture-io,cli-version}.function.test.ts`,
`src/node/__tests__/stackra.test.ts`.

1. `stackra`, `--help`, `-h` and `help` print the command list; `--version` the package version.
2. Two-word commands win over one-word ones; everything after `--` passes untouched; unknown options are usage errors.
3. Exit codes: 0 success, 1 failure, 2 usage, 127 a tool that cannot start. `runCli` never throws.

## Requirements

- **FR-001**: No code entry; `bin.stackra` only (ADR 0127 2026-10-24 note lists code entries; a binary is not one).
- **FR-002**: Gen through `@stackra/gen/node` `generate` and `@stackra/gen` `formatGenError` only; no copy of gen.
- **FR-003**: MCP and agent files through `@stackra/mcp/node` only.
- **FR-004**: Tools start without a shell, with each `node_modules/.bin` above the member first on `PATH`.
- **FR-005**: No Figentra-internal operation (ADR 0282 decision 4); no `@stackra-pro/*` import.

## Success Criteria

- **SC-001**: Spec, package files and changeset exist; the package passes format and lint.
- **SC-002**: Every command and public function has a test beside it.
- **SC-003**: The tests, typecheck and build pass in the separate testing workflow.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
