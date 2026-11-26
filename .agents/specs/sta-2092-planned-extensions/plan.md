# Implementation Plan: planned Postgres extensions are created before migrations on AWS and GCP

**Spec**: `.agents/specs/sta-2092-planned-extensions/spec.md` · **Linear**: STA-2092 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2092-planned-extensions/spec.md`

## Summary

`@stackra/runway` gains the list (`plannedExtensions`) and the script (`createExtensionsScript`). On AWS,
`awsDatabases` declares, per Postgres resource with planned extensions, a one-shot Fargate task (own security group,
password from the RDS Proxy secret) run through the existing migration run provider with `purpose: "extensions"`, and
hands each run to `awsWorkloads`, whose migrations and services depend on it. On GCP, `gcpRuntimeConfig` reads the
services' extensions, and `gcpRuntime` calls the new `databaseExtensions` block: the admin user, an in-region secret
copy, a reader account and a Cloud Run job run to completion inside the apply. `DEPLOY_ROLES` gains the Secret Manager
role the block needs.

## Technical Context

- **Language**: TypeScript (ESM), Node 24; Pulumi (`@pulumi/aws`, `@pulumi/gcp`)
- **Members**: `packages/developer/runway`, `packages/infrastructure/infra-aws-runtime`,
  `packages/infrastructure/infra-gcp`
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022), Pulumi mocks; a real Postgres 18 in `stackra-demo` for the
  script
- **Storage**: none new (Secret Manager holds the GCP copy of the admin password)
- **Runtime target**: node (deploy time)

## Constitution Check

| Law                                   | Result | Note                                                                           |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | both infra packages already depend on `@stackra/runway`                        |
| Secrets (ADR 0009)                    | PASS   | the admin password is a Pulumi secret input or read at run time; never in code |
| Security                              | PASS   | outbound-only setup group; script refuses unapproved names; one reader account |
| HTTP and events                       | N/A    | no route, header or event changes                                              |
| Tenancy                               | N/A    | schema objects only, no tenant rows                                            |
| Delegation                            | PASS   | one session, one branch                                                        |
| Not built yet (ADR 0011)              | PASS   | builds the ADR 0160 note of 2026-11-03                                         |
| Test placement (ADR 0022)             | PASS   | tests sit in `__tests__/` beside each changed file                             |
| Versions and catalogs                 | PASS   | no dependency added; the client image is pinned in a constant                  |
| Deploy modes (ADR 0076)               | PASS   | AWS and GCP cloud deploys; air-gapped unchanged                                |
| Licence tier (ADR 0077)               | PASS   | free                                                                           |
| Docs and ADRs                         | PASS   | ADR 0160 note, three READMEs, infra-gcp AGENTS.md and three changesets         |

## Deploy modes

| Mode       | Behaviour                                                                  |
| ---------- | -------------------------------------------------------------------------- |
| SaaS       | the apply creates planned extensions before migrations on AWS and GCP      |
| On-prem    | same when deployed with these infra packages                               |
| Air-gapped | unchanged: the install runbook pre-creates extensions with the admin login |

## Correctness properties

- **P-001**: `plannedExtensions` is sorted, deduplicated and a subset of what the named members' runways list — Validates: FR-001
- **P-002**: for every extension list, the script contains no name outside `PostgresExtension`, runs under `set -eu` and `ON_ERROR_STOP=1`, and stops at the first failure — Validates: FR-002
- **P-003**: for every workload using a database with planned extensions, its migration and service depend on that database's run — Validates: FR-003, FR-004
- **P-004**: the password never appears in a task or job definition — Validates: FR-003, FR-007
- **P-005**: for every provider module the extensions path declares, a role in `DEPLOY_ROLES` covers it — Validates: FR-009
- **P-006**: with no planned extension, the resource set equals the one before this change — Validates: FR-010

## Architecture overview

The runway package stays pure: it computes the list and the script text. Each cloud package owns how the script runs
with the admin login. AWS reuses the migration run provider (a dynamic Pulumi resource that runs a Fargate task and
waits for exit 0), so the extensions run fails the apply the same way a migration does. GCP uses a Cloud Run job whose
execution token ties it to the apply, reading the password from Secret Manager at run time.

## Components and responsibilities

- `plannedExtensions`, `createExtensionsScript` (`packages/developer/runway/src/core/functions/`), exported from
  `packages/developer/runway/src/core/index.ts`.
- `runtimePlan` (`infra-aws-runtime/src/core/functions/runtime-plan.function.ts`): uses `plannedExtensions`.
- `awsDatabases` (`infra-aws-runtime/src/node/functions/aws-databases.function.ts`): the setup task and run.
- `awsWorkloads`, `awsRuntime` (`infra-aws-runtime/src/node/functions/`): the `ready` wiring.
- The migration run provider (`infra-aws-runtime/src/node/constants/workload-migration-provider.constant.ts`) and
  `WorkloadMigrationInputs` (`src/node/types/workload-migration-inputs.type.ts`): `purpose`.
- `DATABASE_SETUP_SETTINGS` (both infra packages): image, CPU, memory, log days, container name.
- `gcpRuntimeConfig`, `GcpRuntimeConfig` (`infra-gcp/src/core/`): `database.extensions`.
- `gcpRuntime`, `databaseExtensions` (`infra-gcp/src/node/functions/`): the GCP block.
- `DEPLOY_ROLES` (`infra-gcp/src/node/constants/deploy-roles.constant.ts`): `roles/secretmanager.admin`.

## Files and folders

```text
packages/developer/runway/
├── README.md
└── src/core/{index.ts, functions/{planned-extensions,create-extensions-script}.function.ts} (+ tests)
packages/infrastructure/infra-aws-runtime/
├── README.md
└── src/{core/functions/runtime-plan.function.ts, node/constants/{database-setup-settings,workload-migration-provider}.constant.ts, node/functions/{aws-databases,aws-runtime,aws-workloads}.function.ts, node/types/workload-migration-inputs.type.ts} (+ tests)
packages/infrastructure/infra-gcp/
├── AGENTS.md, README.md
└── src/{core/constants/database-setup-settings.constant.ts, core/functions/gcp-runtime-config.function.ts, core/types/gcp-runtime-config.type.ts, node/constants/deploy-roles.constant.ts, node/functions/{database-extensions,gcp-runtime}.function.ts} (+ tests)
apps/docs/src/docs/adr/0160-raw-sql-at-runtime-and-the-approved-postgres-extensions.mdx
.changeset/{runway-planned-extensions,infra-aws-runtime-extensions-before-migrations,infra-gcp-extensions-before-migrations}.md
```

## Data models and migrations

none

## Contracts

- `plannedExtensions(services, environment, members = Object.keys(services)): PostgresExtension[]` (new).
- `createExtensionsScript(extensions: readonly PostgresExtension[]): string` (new; throws on empty or unapproved).
- `awsDatabases(plan, options, workloadGroups = [], ready = new Map())`; `awsWorkloads(plan, options, securityGroup,
databasesReady = new Map())`.
- `WorkloadMigrationInputs.purpose?: "migrate" | "extensions"`.
- `gcpRuntimeConfig(root, environment, dedicated?, services = {})`; `GcpRuntimeConfig.database.extensions`.
- `gcpRuntime(config, { adminPassword?, subnet?, … })`: throws `TypeError` when extensions are planned without
  `adminPassword`.
- `DEPLOY_ROLES` gains `roles/secretmanager.admin`.

## Error handling

A failed or timed-out extensions run fails the apply with a message that says no migration ran. `gcpRuntime` refuses
planned extensions without an admin password at plan time. The script stops non-zero at the first database psql fails
in.

## Security and tenancy

The admin password: AWS reads it from the RDS Proxy secret inside the task (the execution role may read that one
secret); GCP keeps a regional Secret Manager copy readable only by the job's service account. The setup security group
has no ingress and egress only to Postgres and HTTPS. No password reaches a definition, log or output.

## Testing strategy

- AC-001: `aws-databases.function.test.ts` (admin login, once per revision, own group), `aws-workloads.function.test.ts`
  (migration and service after the run), `gcp-runtime.function.test.ts` (private IP and connector paths),
  `create-extensions-script.function.test.ts`, and the Postgres 18 run in `stackra-demo`.
- AC-002: `workload-migration-provider.constant.test.ts` ("…whose failure says no migration ran"), the script's exit 2
  without CONNECT.
- AC-003: `aws-databases.function.test.ts` ("…the password read from the proxy's secret"), `gcp-runtime.function.test.ts`.
- AC-004: `aws-databases.function.test.ts` ("gives a database without extensions no run…"),
  `gcp-runtime.function.test.ts` ("creates no login, secret or job when no service names an extension").
- AC-005: `deploy-roles.constant.test.ts`.
- AC-006: `create-extensions-script.function.test.ts` ("refuses a name outside the approved list…").

## Rollout

Minor changesets for the three packages. GCP projects that name extensions pass `adminPassword`, enable the Secret
Manager API (and Compute Engine for a private server), and re-apply the foundation stack first; the READMEs and the
`infra-gcp` changeset list the owner steps.

## Delegation and risk plan

One session, one branch (PR #1143). Change risk R3: a secret input and a new deploy-identity role. Follow-up option:
a custom Secret Manager role narrower than `secretmanager.admin` (spec R-1).

## ADRs

ADR 0160 (decision 2; notes of 2026-11-03 and 2026-11-26), ADR 0493, ADR 0444 (decision 4), ADR 0238, ADR 0186,
ADR 0172 (decision 1), ADR 0173, ADR 0525: all Accepted.

## Docs

The ADR 0160 note, `packages/developer/runway/README.md`, `packages/infrastructure/infra-aws-runtime/README.md`,
`packages/infrastructure/infra-gcp/README.md`, `packages/infrastructure/infra-gcp/AGENTS.md`, three changesets.

## Complexity tracking

none
