# Implementation Plan: stackra dev runs the dev compose of environments.dev.infra

**Spec**: `.agents/specs/sta-2664-dev-infra-compose/spec.md` · **Linear**: STA-2664 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2664-dev-infra-compose/spec.md`

## Summary

`@stackra/runway` gains a pure planner, `devComposeOf`, over a kind table, `DEV_INFRA_KINDS`. `@stackra/cli` writes
the planned Compose files and starts them with `docker compose up --detach --wait` before the member tool, records the
lane and opt-ins, and lays the containers' variables under the dev-secrets values in the member's environment.
`writeDevFacts` writes the infra addresses.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/developer/runway`, `packages/developer/cli` (developer)
- **Testing**: vitest in `src/**/__tests__/`; a real-container proof in a Linux container with Docker
- **Storage**: none (generated files under `.stackra/dev/`)
- **Runtime target**: the developer machine (Docker with the compose plugin)

## Constitution Check

| Law                                   | Result | Note                                                           |
| ------------------------------------- | ------ | -------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the CLI imports runway, as before; runway imports nothing new  |
| Secrets (ADR 0009)                    | PASS   | no credential planned or written; names only in the state file |
| Security                              | PASS   | every port on 127.0.0.1                                        |
| HTTP and events                       | N/A    | none                                                           |
| Tenancy                               | N/A    | dev only                                                       |
| Delegation                            | PASS   | Claude only                                                    |
| Not built yet (ADR 0011)              | PASS   | builds ADR 0199 decision 3, which was planned                  |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/` beside each subject                      |
| Versions and catalogs                 | PASS   | changesets: minor for @stackra/runway and @stackra/cli         |
| Deploy modes (ADR 0076)               | PASS   | dev only; deploys unchanged                                    |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                      |
| Docs and ADRs                         | PASS   | the two READMEs and the root runway schema descriptions        |

## Deploy modes

| Mode       | Behaviour                                   |
| ---------- | ------------------------------------------- |
| SaaS       | unchanged; the dev compose is dev only      |
| On-prem    | unchanged; the on-prem bundle is ADR 0179's |
| Air-gapped | unchanged                                   |

## Correctness properties

- **P-001**: every planned port string is `127.0.0.1:<host>:<container>` with the host port from the runway, moved by
  lane for a per-lane block — Validates: AC-001, AC-002, AC-003
- **P-002**: a plan with an issue holds no document and no variable — Validates: AC-005
- **P-003**: an opt-in block not asked for has a profile and gives no variable — Validates: AC-015
- **P-004**: a member's run never overrides a variable the shell sets, and the dev-secrets file wins over the compose
  — Validates: AC-008
- **P-005**: no Docker call happens without a container to start, and a file with one is brought up before the tool —
  Validates: AC-006, AC-014
- **P-006**: a member's run with any AWS credential source never gets the placeholder AWS key pair, and one with none
  always does — Validates: AC-011, AC-012

## Architecture overview

`DEV_COMMAND` member mode: `devReady` → `writeDevFacts(root, lane)` → `devInfra` (skip on `--no-infra`, clearing the
state; skip when `TURBO_HASH` is set) → `startDevInfra` → `planDevInfra` (`readRunway` + `devComposeOf`) →
`.stackra/dev/compose.yaml`, `.stackra/dev/compose.shared.yaml`, `.stackra/dev/infra.json` →
`docker compose -f <file> [--profile <name>] up --detach --wait [--remove-orphans]` → `MEMBER_DEV.run` →
`toolCommand` → `runProcess` with `{ ...tool.env, ...devInfraEnv(cwd, runEnv), ...devSecretEnv(cwd) }`, where
`runEnv` is the shell, `tool.env` and the dev-secrets values, so `hasAwsCredentialSource` sees every credential the run
will have. Runway plans (pure); the CLI writes, starts and lays the variables.

## Components and responsibilities

- `@stackra/runway` core: `DEV_INFRA_KINDS` (ports, primary address, lane sharing, command, volume, health check,
  buckets, member variables and placeholder credentials per kind) and `devComposeOf` (validation, lane shift,
  documents, variables, `fallbackCredentials` apart from `env`).
- `@stackra/runway` node: `writeDevFacts` adds `infra`.
- `@stackra/cli`: `planDevInfra`, `startDevInfra`, `readDevInfraState`, `devInfraEnv` (the variables, plus a kind's
  placeholder credentials only when `hasAwsCredentialSource` finds no AWS credential), `hasAwsCredentialSource`, the
  `--infra`/`--no-infra` flags in `DEV_COMMAND`, the variable layer in `toolCommand`, the compose-provided list in
  `stackra dev secrets init`.

## Files and folders

```text
packages/developer/runway/
  README.md
  schema/root.json
  src/core/index.ts
  src/core/__tests__/index.test.ts
  src/core/constants/dev-infra-kinds.constant.ts
  src/core/functions/dev-compose-of.function.ts
  src/core/functions/__tests__/dev-compose-of.function.test.ts
  src/core/types/compose-document.type.ts
  src/core/types/compose-service.type.ts
  src/core/types/dev-compose-input.type.ts
  src/core/types/dev-compose-plan.type.ts
  src/core/types/dev-credential-fallback.type.ts
  src/core/types/dev-infra-healthcheck.type.ts
  src/core/types/dev-infra-issue.type.ts
  src/core/types/dev-infra-kind.type.ts
  src/core/types/dev-infra-service.type.ts
  src/node/functions/write-dev-facts.function.ts
  src/node/functions/__tests__/write-dev-facts.function.test.ts
packages/developer/cli/
  README.md
  src/node/commands/dev-secrets-init.command.ts
  src/node/commands/__tests__/dev-secrets-init.command.test.ts
  src/node/dev-infra/constants/dev-infra-files.constant.ts
  src/node/dev-infra/functions/dev-infra-env.function.ts
  src/node/dev-infra/functions/has-aws-credential-source.function.ts
  src/node/dev-infra/functions/plan-dev-infra.function.ts
  src/node/dev-infra/functions/read-dev-infra-state.function.ts
  src/node/dev-infra/functions/start-dev-infra.function.ts
  src/node/dev-infra/functions/__tests__/dev-infra-env.function.test.ts
  src/node/dev-infra/functions/__tests__/has-aws-credential-source.function.test.ts
  src/node/dev-infra/functions/__tests__/start-dev-infra.function.test.ts
  src/node/dev-infra/types/dev-infra-state.type.ts
  src/node/dev-surface/constants/dev-command.constant.ts
  src/node/dev-surface/constants/__tests__/dev-command.constant.test.ts
  src/node/functions/tool-command.function.ts
  src/node/functions/__tests__/tool-command.function.test.ts
tools/schemas/runway-root.schema.json
.changeset/runway-dev-compose.md
.changeset/cli-dev-compose.md
```

## Data models and migrations

None. Generated files only, under the gitignored `.stackra/dev/`: `compose.yaml`, `compose.shared.yaml` and
`infra.json` (`{ "lane": <n>, "optIn": [<name>…] }`).

## Contracts

Additive exports from `@stackra/runway` (listed in spec.md under Impact). `DevComposePlan` carries `env` (the
variables a member gets), `fallbackCredentials` (`DevCredentialFallback[]`: `{ chain: "aws", env }`, given only to a
run with no credential on that chain), `provides`, `issues` and `warnings`. The Compose documents follow the Compose
specification. The dev facts `infra` field keeps its schema (`port`, `url`). `stackra dev` gains `--infra <name>[,…]`
and `--no-infra`.

## Error handling

A refusal prints `environments.dev.infra <code>: <message>` per issue and exits 1 before writing. Docker that cannot
start exits 127 with the `stackra doctor` and `--no-infra` hint; any other Docker failure exits with its code and names
`docker compose logs`. A broken state file or a refused runway gives a member's run no variable.

## Security and tenancy

Loopback-only ports; no credential written; the state file has no value. No global AWS key variable over a developer's
own credential: SeaweedFS has no identity configured and takes any signature, so a profile or SSO keeps signing for S3
and for every other AWS client of the run; the placeholder pair reaches only a run with no AWS credential at all. An
instance role alone is not detected (it needs a network call); an empty `~/.aws/config` keeps the pair out on such a
host. Tenancy: none, dev only.

## Testing strategy

- AC-001 to AC-005, AC-013, AC-015: `dev-compose-of.function.test.ts`; the exports in `index.test.ts`.
- AC-010: `write-dev-facts.function.test.ts`.
- AC-006, AC-007, AC-014, AC-015: `start-dev-infra.function.test.ts` with a fake process runner.
- AC-008, AC-011, AC-012: `dev-infra-env.function.test.ts` (a profile, `~/.aws/credentials`, `~/.aws/config`, none),
  `has-aws-credential-source.function.test.ts`, and `tool-command.function.test.ts` (the dev-secrets file names a
  profile).
- AC-009: `dev-command.constant.test.ts`. AC-016: `dev-secrets-init.command.test.ts`.
- AC-017: the real-container proof in a Linux container with Docker (its log attached to the pull request).
- Each behaviour test fails with its change reverted (the revert log is in the proof folder).

## Rollout

Changesets: minor for `@stackra/runway` and `@stackra/cli`. Products opt in by adding blocks to
`environments.dev.infra`; a runway with only `gateway` and `postgres` behaves as before. Rolling back is reverting the
release; the generated files are dev only.

## Known risks

- SeaweedFS refuses writes on a data disk with less than 1 % free; the PUT hangs rather than fails. The first review
  probe met it on a test machine whose root disk was full.
- An instance role alone is not seen as an AWS credential source (see Security and tenancy).

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2: the change waits for the CTO's approval stop before it merges.

## ADRs

Implements ADR 0199 decision 3 within ADR 0296 decision 1 and ADR 0170; no new ADR.

## Docs

`packages/developer/runway/README.md`, `packages/developer/cli/README.md`, `tools/schemas/runway-root.schema.json` and
`packages/developer/runway/schema/root.json`, the two changesets.

## Complexity tracking

none
