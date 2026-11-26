# Feature Specification: MCP server secrets reach the environment, never argv

**Feature Branch**: `figentra/sta-1617-mcp-secrets-off-argv`

**Created**: 2026-11-26

**Status**: Implementing <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-1617

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: Both ways Stackra starts a token-based MCP server put the token on the server's command line.
`tools/scripts/mcp.sh` ran `secrets-exec.mjs --expand-args`, which replaced `$NAME` in the `.mcp.yaml` arguments with
the value (`--api-key <value>`, `Authorization:Bearer <value>`), and `stackra mcp exec` (`@stackra/mcp`, the
template's launcher) built an `sh -c` line that expanded `$NAME` into the server's arguments. Any process listing
(`ps`) then shows the value for as long as the server runs. The STA-303 guard denies a listing next to a wrapper, but
the root cause is the argv itself. Done when no `.mcp.yaml` server receives a secret on argv, with a test that fails
if one does.

### Sources

- `tools/scripts/mcp.sh`, `tools/scripts/secrets-exec.mjs`, `.mcp.yaml`, `flow.config.json` (`mcp`) before this change
- `packages/developer/mcp/src/core/functions/mcp-exec-command.function.ts`, `rule-issues.function.ts`,
  `packages/developer/mcp/src/node/functions/exec-with-secrets.function.ts`,
  `packages/developer/cli/src/node/constants/mcp-exec-command.constant.ts` before this change
- The published servers read on box 2: `@upstash/context7-mcp@4.9.0` (`CONTEXT7_API_KEY`), `@stripe/mcp@0.3.4`
  (`STRIPE_SECRET_KEY`), `resend-mcp@2.30.0` (`RESEND_API_KEY`), `mcp-remote@0.17.1` (`--header-file`, whose values
  get `${VAR}` substitution from the process environment)
- `apps/docs/src/docs/runbooks/token-rotation.mdx` ("STA-1617 moves them to environment variables"), ADR 0525
  (sops `agents` scope), ADR 0267 (the model never sees a secret), ADR 0282 decision 3 (`stackra mcp exec`), ADR 0173
- FR-001 to FR-007: the PR's diff against `main` and its tests (`mcp-sh.test.mjs`, `secrets-exec.test.mjs`,
  `mcp-exec-command.function.test.ts`, `rule-issues.function.test.ts`, `exec-with-secrets.function.test.ts`,
  `parse-mcp-config.function.test.ts`, `mcp-exec-command.constant.test.ts`)

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/mcp (`mcpExecCommand`, `execWithSecrets`, `McpExecOptions.secrets`,
  `ruleIssues` code `secret_on_argv`), packages/developer/cli (`stackra mcp exec --env`), packages/developer/flow-preset
  (the secrets rule text); repository tooling `tools/scripts/mcp.sh`, `tools/scripts/secrets-exec.mjs`,
  `tools/scripts/mcp-github.headers`, `flow.config.json` and the generated `.mcp.yaml`
- **Public contract change**: breaking for `stackra mcp exec` users. `stackra mcp exec` gains `--env NAME[,NAME…]`;
  `mcpExecCommand` / `execWithSecrets` take `secrets` in `McpExecOptions` and now refuse a `$NAME` in `argv` instead of
  expanding it; `ruleIssues` reports a `$NAME` on a local server's command line as the new code `secret_on_argv`
  (before: accepted after `stackra mcp exec --`). `secrets-exec.mjs` (repository tooling, not published) drops
  `--expand-args` and `expandArg`.
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: closes the exposure: no secret value is on any MCP server's argv. Error messages name
  secrets, never values, and an `--env` name that is not SCREAMING_SNAKE is refused without being echoed (it may be a
  pasted value).
- **Secrets**: names only (`CONTEXT7_API_KEY`, `GITHUB_PERSONAL_ACCESS_TOKEN`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`);
  `tools/scripts/mcp-github.headers` holds a `${GITHUB_PERSONAL_ACCESS_TOKEN}` placeholder, never a value
- **ADR needed**: no (applies ADR 0267 and ADR 0525's "into the MCP server's process only" and the token-rotation
  runbook's rule that a value belongs in a child's environment or stdin, never its argv; ADR 0282 decision 3 keeps
  `stackra mcp exec` as the launcher)
- **New dependencies**: none. `.mcp.yaml` pins the four servers to the versions whose environment handling was read
  (`@upstash/context7-mcp@4.9.0`, `mcp-remote@0.17.1`, `@stripe/mcp@0.3.4`, `resend-mcp@2.30.0`) instead of `@latest`
- **Deploy modes**: same in all three (developer tooling only)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/developer/mcp/README.md`, `packages/developer/cli/README.md`,
  `packages/developer/cli/AGENTS.md`, `apps/docs/src/docs/runbooks/secrets.mdx`,
  `apps/docs/src/docs/runbooks/token-rotation.mdx`, `.flow/overrides/rules/secrets.md` (and the generated
  `.agents/rules/secrets.md`), `packages/developer/flow-preset/preset/rules/secrets.md`, `tools/scripts/README.md`;
  a minor changeset for `@stackra/mcp` and `@stackra/cli`, a patch for `@stackra/flow-preset`
- **Lane**: full (a breaking change to a published launcher and a security fix)
- **Change risk**: R2 (developer MCP servers fail to start if a token is not declared with `--env`; the template must
  migrate its `context7` line when it adopts the release)

## Glossary _(full lane)_

- **Launcher**: what starts a token-based MCP server: `tools/scripts/mcp.sh` in this repository, `stackra mcp exec` in
  a Stackra project (the template).
- **Declared secret**: a name after `--env`; its value is decrypted by sops from the `agents` scope of the local
  figentra/secrets clone into the server's environment.
- **Secret reference**: `$NAME` or `${NAME}` (SCREAMING_SNAKE) in a string.
- **Header file**: a committed file mcp-remote reads with `--header-file`, one `Name: value` per line, whose values may
  hold `${NAME}` placeholders that mcp-remote fills from its own environment.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A process listing never shows an MCP token (Priority: P1)

A developer with Claude Code open runs `ps` (or any tool that lists processes). The context7, GitHub, Stripe and Resend
MCP servers are running; none of their command lines holds a token.

**Why this priority**: the token stays on argv for the whole session today, readable by any process of any user.

**Independent Test**: launch every `.mcp.yaml` server that starts through `mcp.sh` with its own arguments, a fake
`sops` returning canaries and a fake `npx` that records its argv and environment.

**Acceptance Scenarios**:

1. **Given** the committed `.mcp.yaml`, **When** each `mcp.sh` server starts, **Then** each declared secret is in its
   environment and no canary is on its argv.
2. **Given** the `github` server, **When** it starts, **Then** its header file holds only `${NAME}` placeholders of
   declared names, and they resolve from its environment to the token.

---

### User Story 2 - A wrong `.mcp.yaml` line fails loudly (Priority: P1)

Someone adds `--api-key $X` to a server, as the old docs said.

**Why this priority**: silently passing the literal `$X`, or expanding it, would bring the leak back.

**Independent Test**: run `mcp.sh` and `stackra mcp exec` with a reference in the arguments; check `.mcp.yaml` with
`ruleIssues`.

**Acceptance Scenarios**:

1. **Given** `mcp.sh ... --api-key $CONTEXT7_API_KEY`, **When** it runs, **Then** it exits 2 naming
   `CONTEXT7_API_KEY`, before anything is decrypted or started.
2. **Given** `stackra mcp exec -- npx ... --api-key $CONTEXT7_API_KEY`, **When** it runs, **Then** it refuses the same
   way, and `parseMcpConfig` reports `secret_on_argv` with the `--env` fix in the message.

---

### User Story 3 - A template project declares its tokens (Priority: P2)

A Stackra project writes `stackra mcp exec --env CONTEXT7_API_KEY -- npx -y @upstash/context7-mcp@4.2.0`.

**Acceptance Scenarios**:

1. **Given** that line, **When** it runs, **Then** sops puts the value into the server's environment and the server's
   argv never holds it.

---

### Edge Cases

- **EC-01**: A launch that names no secret starts unchanged, without sops.
- **EC-02**: An `--env` name that is not SCREAMING_SNAKE is a usage error and is never echoed.
- **EC-03**: A declared name with no file in the clone is skipped by `secrets-exec.mjs` (unchanged); the server then
  starts without it and reports its own missing key.
- **EC-04**: `mcp.sh` changes to the repository root before starting the server, so a relative `--header-file`
  resolves wherever the client started.
- **EC-05**: The session's Linear digest (`mcp.sh node tools/scripts/linear.mjs digest`) keeps its built-in names and
  needs no `--env`.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE `mcp.sh` launcher SHALL take the secret names a server reads from `--env NAME[,NAME…]` and hand only
  those (plus the Linear digest's built-in names) to `secrets-exec.mjs`, which puts each value into the server's
  environment.
- **FR-002**: IF a `mcp.sh` argument holds a `$NAME` or `${NAME}` reference THEN THE launcher SHALL exit 2 naming it,
  before any decrypt or start.
- **FR-003**: THE `secrets-exec.mjs` script SHALL never put a value on any argv: `--expand-args` is removed and refused
  as a usage error.
- **FR-004**: THE committed `.mcp.yaml` SHALL start context7, GitHub, Stripe and Resend with `--env` and no secret
  reference on their command lines; GitHub's header comes from `tools/scripts/mcp-github.headers`, a placeholder file.
- **FR-005**: THE `stackra mcp exec` command SHALL accept `--env NAME[,NAME…]`, and `mcpExecCommand` SHALL decrypt
  those names into the server's environment through nested `sops exec-env` and run `argv` with no expansion.
- **FR-006**: IF `argv` given to `mcpExecCommand` holds a `$NAME` reference, or an `--env` name is not SCREAMING_SNAKE,
  THEN it SHALL throw without starting anything and without echoing a bad name.
- **FR-007**: THE `.mcp.yaml` check (`ruleIssues`) SHALL report a `$NAME` anywhere on a local server's command line as
  `secret_on_argv`, keep `secret_without_exec` for a reference in `env`, and point a remote server's header token at
  mcp-remote with a `--header-file`.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN any `.mcp.yaml` server that starts through `mcp.sh` launches THE launcher SHALL put each declared
  secret in its environment and none on its argv.
- **AC-002**: WHEN a launcher's arguments hold a secret reference THE launcher SHALL refuse before anything decrypts
  or starts.
- **AC-003**: WHEN `stackra mcp exec --env NAME -- <argv>` runs THE server SHALL read the value from its environment
  and its argv SHALL not hold it.
- **AC-004**: WHEN a `.mcp.yaml` local server holds `$NAME` on its command line THE check SHALL report
  `secret_on_argv`.
- **AC-005**: THE `secrets-exec.mjs` script SHALL refuse `--expand-args` and pass every argument through unexpanded.

## Success Criteria _(mandatory)_

- **SC-001**: `tools/scripts/__tests__/mcp-sh.test.mjs` proves AC-001 and AC-002 and fails on `main`'s `mcp.sh`,
  `secrets-exec.mjs` and `.mcp.yaml` ("context7: CONTEXT7_API_KEY on argv") — verified by: unit
- **SC-002**: `exec-with-secrets.function.test.ts` and `mcp-exec-command.function.test.ts` prove AC-003 and FR-006,
  `rule-issues.function.test.ts` AC-004, `secrets-exec.test.mjs` AC-005; each fails on `main`'s source — verified by:
  unit
- **SC-003**: the `@stackra/mcp` and `@stackra/cli` tests, typecheck, oxlint and oxfmt pass — verified by: manual

## Compatibility and migration

- This repository: `.mcp.yaml` is regenerated from `flow.config.json`; a developer reruns `pnpm spec:sync` (or
  `pnpm install`) to refresh `.mcp.json`. Each server now starts through `mcp.sh --env NAME --`.
- Stackra projects (the template): `stackra mcp exec -- npx … --api-key $CONTEXT7_API_KEY` stops with a refusal after
  the `@stackra/cli` release; it becomes `stackra mcp exec --env CONTEXT7_API_KEY -- npx …`. A header token moves to a
  committed mcp-remote `--header-file` with a `${NAME}` placeholder. The template change ships with its upgrade to the
  release (follow-up on STA-1617).
- Anything that called `secrets-exec.mjs --expand-args` gets a usage refusal; only `mcp.sh` did.

## Risks

- **R-1**: A server that only takes its token as a flag cannot be started this way; it needs an environment variable,
  a config file or a wrapper. The four servers here all read their environment.
- **R-2**: The environment of a process is readable by the same user (`/proc/<pid>/environ`, `ps e`); the STA-303
  guard still denies those listings for agents. Argv was readable by every user.
- **R-3**: Pinning the servers stops silent upgrades; Renovate or a person bumps them.

## Out of scope

- The template repository's `.mcp.yaml` (needs the published `@stackra/cli` with `--env`).
- Removing `shellCommandLine`'s `$NAME` expansion (public export, now unused for references by `mcpExecCommand`).

## Assumptions

- Claude Code starts project MCP servers with the repository root as working directory or resolves `./tools/scripts`
  from it; `mcp.sh` then changes to the root itself.

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-26 · — → Draft · Claude (STA-1617 session) · created from the PR diff
- 2026-11-26 · Draft → Clarified · Claude (STA-1617 session) · clarifications complete
- 2026-11-26 · Clarified → Planned · Claude (STA-1617 session) · plan.md
- 2026-11-26 · Planned → Tasked · Claude (STA-1617 session) · tasks.md
- 2026-11-26 · Tasked → Implementing · Claude (STA-1617 session) · T001 to T010 committed on the branch
