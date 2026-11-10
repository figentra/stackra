# Implementation Plan: `stackra dev secrets init` writes generated dev values and `stackra dev` injects them

**Spec**: `.agents/specs/sta-2679-dev-secrets/spec.md` · **Linear**: STA-2679 · **Date**: 2026-11-10

**Input**: Feature specification from `.agents/specs/sta-2679-dev-secrets/spec.md`

## Summary

A new `dev-secrets/` group in the CLI. `classifyDevSecrets` sorts the manifests' secret rows into generated, needing a
value and optional; `planDevSecrets` merges them with the existing file, `--from` and `--rotate`; the command
`dev:secrets:init` (routed as `stackra dev secrets init`) reads the manifests, writes the file with mode 600 and
prints names only. `devSecretEnv` gives a member's tool run the values of its own declared names, and `toolCommand`
adds them to the `dev` run.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/developer/cli` (developer); `packages/infrastructure/infra-testbed` (one exclude)
- **Testing**: vitest in `src/**/__tests__/`, on the Testbed and CI
- **Storage**: `<workspace>/.stackra/dev-secrets.json` (gitignored by `**/.stackra/*`)
- **Runtime target**: the developer's workstation

## Constitution Check

| Law                                   | Result | Note                                                           |
| ------------------------------------- | ------ | -------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | the CLI reads manifests through `@stackra/contracts` types     |
| Secrets (ADR 0009, 0525)              | PASS   | generated dev values only; never printed, never sops, mode 600 |
| Security                              | PASS   | excluded from testbed uploads; read-deny guard on owner list   |
| HTTP and events                       | N/A    | none                                                           |
| Tenancy                               | N/A    | none                                                           |
| Delegation                            | PASS   | Claude only                                                    |
| Not built yet (ADR 0011)              | PASS   | no `.env` file: a gitignored JSON file                         |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                                          |
| Versions and catalogs                 | PASS   | a changeset patches @stackra/cli                               |
| Deploy modes (ADR 0076)               | PASS   | dev only                                                       |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                      |
| Docs and ADRs                         | PASS   | ADR 0525 amendment note                                        |

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | no deployed environment reads the file; runway syncs real values |
| On-prem    | the same: the file is a workstation's dev values only            |
| Air-gapped | the same: the file is a workstation's dev values only            |

## Correctness properties

- **P-001**: every generated name is a required, dev-needed `secret` row that is not connection-shaped and not the
  relay key — Validates: AC-001, AC-002
- **P-002**: add-only without `--rotate`; a refusal when nothing is missing; `--rotate` keeps hand-set names —
  Validates: AC-003
- **P-003**: `--from` values win over generation for matching names — Validates: AC-004
- **P-004**: a member's dev run sees only its declared names' values — Validates: AC-005
- **P-005**: no output line holds a value — Validates: AC-001

## Architecture overview

Init reads every non-package member's committed manifest (gen writes it), so a service's rows already include its
packages'. The dev run reads one file at the workspace root, because turbo's strict env mode drops variables set at
the root before a member's task starts.

## Components and responsibilities

- `classifyDevSecrets(rows)`: generated, needing a value, optional.
- `planDevSecrets(input)`: the file's next values and what was generated or copied, or a refusal.
- `readDevSecrets(file)`: the file's values, or undefined when absent; throws on a malformed file without values.
- `devSecretEnv(memberRoot)`: the member's declared names' values.
- `DevSecretsInitCommand`: the IO.
- `toolCommand`: the `dev` run's environment.

## Files and folders

```text
packages/developer/cli/src/node/
  dev-secrets/constants/dev-secrets-file.constant.ts
  dev-secrets/types/dev-secret-row.type.ts
  dev-secrets/types/dev-secret-names.type.ts
  dev-secrets/types/dev-secrets-plan.type.ts
  dev-secrets/functions/classify-dev-secrets.function.ts
  dev-secrets/functions/plan-dev-secrets.function.ts
  dev-secrets/functions/read-dev-secrets.function.ts
  dev-secrets/functions/declared-dev-secrets.function.ts
  dev-secrets/functions/dev-secret-env.function.ts
  dev-secrets/functions/runway-dev-secret-names.function.ts
  dev-secrets/functions/__tests__/*.test.ts
  commands/dev-secrets-init.command.ts
  constants/commands.constant.ts
  constants/testbed-rsync-excludes.constant.ts
  functions/tool-command.function.ts
packages/infrastructure/infra-testbed/src/core/constants/testbed-defaults.constant.ts
apps/docs/src/docs/adr/0525-secrets-sops-and-cloud-kms-replace-infisical.mdx
apps/docs/src/docs/adr/index.mdx
.changeset/cli-dev-secrets.md
```

## Data models and migrations

none

## Contracts

The command `stackra dev secrets init [--rotate] [--from <file>]`; `--json` returns the file path and the name lists.

## Error handling

A malformed file or `--from` file fails naming the file, never its content. Nothing missing without `--rotate`, a
missing `--from` file or a run outside a pnpm workspace is a usage error (exit 2) with the reason.

## Security and tenancy

Values come from `randomBytes(32)` as base64url. The file is written with mode 600 and re-chmodded when it exists. No
log, output or error carries a value.

## Testing strategy

- AC-001, AC-002: `classifyDevSecrets` unit tests.
- AC-003, AC-004: `planDevSecrets` unit tests.
- AC-005: `devSecretEnv` with a temporary workspace.
- AC-001, P-005: the command's test checks the output holds no value.

## Rollout

A patch changeset for `@stackra/cli`, in 0.33.1. The OS lane (os-7c) proved on 2026-11-10 that `encore run` passes
its environment to the app process.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2.

## ADRs

ADR 0525: an amendment note dated 2026-11-10.

## Docs

ADR 0525 only.

## Complexity tracking

none
