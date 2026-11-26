# Implementation Plan: stackra dev runs a product end to end

**Spec**: `.agents/specs/sta-2840-dev-end-to-end/spec.md` · **Linear**: STA-2840 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2840-dev-end-to-end/spec.md`

## Summary

Root `stackra dev` in a product with service members goes through `runDevRoot`: gen on each service, `planDevRoot`
(lane, dev facts, gateway, services, forwards, seed), `syncDevEncoreApp` (one Encore app under `.stackra/dev/encore`,
built as the deploy tree is) with a watch that re-syncs a member on edit, one `encore run`, loopback port forwards to
the gateway, `prepareDevData` (migrate and seed once the gateway answers) and `turbo run dev --filter=!./services/*`
for everything else. The lane comes from `devLane`; the doctor and a Worker's `wrangler dev` use it.

## Technical Context

- **Language**: TypeScript (ESM), Node 24
- **Members**: `packages/developer/cli`, `packages/developer/runway`, `packages/data/database`
- **Testing**: vitest in `src/**/__tests__/`; the end-to-end run on box 2 in the stackra-demo container
- **Storage**: the local Encore databases (dev only)
- **Runtime target**: a developer machine

## Constitution Check

| Law                                   | Result | Note                                                      |
| ------------------------------------- | ------ | --------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | cli imports runway, as before; no new member edge         |
| Secrets (ADR 0009)                    | PASS   | dev secrets as before; no value printed or written        |
| Security                              | PASS   | forwards bind 127.0.0.1 and ::1 only                      |
| HTTP and events                       | PASS   | one Encore app in dev, as deployed (ADR 0289 decision 5)  |
| Tenancy                               | N/A    | none                                                      |
| Delegation                            | PASS   | Claude only                                               |
| Not built yet (ADR 0011)              | PASS   | Encore stays generated (ADR 0091)                         |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                                     |
| Versions and catalogs                 | PASS   | minor changesets for cli and runway, a patch for database |
| Deploy modes (ADR 0076)               | PASS   | dev only                                                  |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                 |
| Docs and ADRs                         | PASS   | the CLI page in both languages                            |

## Deploy modes

| Mode       | Behaviour            |
| ---------- | -------------------- |
| SaaS       | unchanged (dev only) |
| On-prem    | unchanged (dev only) |
| Air-gapped | unchanged (dev only) |

## Correctness properties

- **P-001**: a root run with two services starts one `encore` process, in `.stackra/dev/encore` — Validates: AC-001
- **P-002**: an edit under a member's sources reaches the app rewritten; a test file does not — Validates: AC-002
- **P-003**: a request to a forwarded port gets the gateway's answer; a down gateway answers 502 — Validates: AC-003
- **P-004**: each database gets migrate then seed with its own `DATABASE_URL` — Validates: AC-004
- **P-005**: `lanes.repos` row 1 with 10 worktrees is lane 10; the doctor checks 5000, not 4000 — Validates: AC-005
- **P-006**: a Worker with facts port 8887 runs `wrangler dev --port 8887 --inspector-port 18887` — Validates: AC-006
- **P-007**: encore exiting aborts the fan-out and closes the forwards — Validates: AC-007
- **P-008**: a service builds `.stackra/seed-build/seed.mjs`; the ledger SQL is schema-qualified — Validates: AC-008

## Architecture overview

`DEV_COMMAND` computes the lane, runs the quick doctor on that lane and, at a product root with services, hands over to
`runDevRoot`. The app mirrors the deploy tree (`rewriteMemberAliases`, now shared by both): each member at its
repository path, `#` imports made relative, `__tests__` left out, `node_modules` linked, one `encore.app`.

## Components and responsibilities

- runway: `devLane`, `syncDevEncoreApp`, `syncDevEncoreMember`, `memberImports`, `rewriteMemberAliases`,
  `writeIfChanged`, `linkFolder`; `writeDevFacts` writes the infra ports.
- cli: `runDevRoot`, `planDevRoot`, `encoreMembers`, `watchDevMembers`, `startPortForward`, `waitForHttp`,
  `prepareDevData`, `DEV_ROOT_TOOLS`; `runProcess` takes a signal; the doctor reads the lane; `resolveTool` gives a
  Worker its port; `runDbSeed` builds a service's seed entry.
- database: `seederLedger` names its schema.

## Files and folders

```text
packages/developer/runway/src/core/functions/dev-lane.function.ts
packages/developer/runway/src/core/constants/dev-encore-app-path.constant.ts
packages/developer/runway/src/node/functions/{sync-dev-encore-app,sync-dev-encore-member,member-imports,rewrite-member-aliases,write-if-changed,link-folder,write-dev-facts,encore-deploy-tree}.function.ts
packages/developer/runway/src/node/types/{dev-encore-app,dev-encore-app-request}.type.ts
packages/developer/cli/src/node/dev-root/**
packages/developer/cli/src/node/dev-surface/constants/dev-command.constant.ts
packages/developer/cli/src/node/doctor/**
packages/developer/cli/src/node/functions/{resolve-tool,run-db-seed,run-process}.function.ts
packages/developer/cli/src/node/types/tool-run.type.ts
packages/data/database/src/node/functions/seeder-ledger.function.ts
apps/docs/src/docs/cli.mdx, apps/docs/src/docs/cli.ar.mdx
.changeset/dev-root-one-encore-app.md, .changeset/seeder-ledger-schema.md
```

## Data models and migrations

none

## Contracts

Additive exports of `@stackra/runway` (see the spec); `stackra dev --seed`.

## Error handling

A forward that cannot listen is named and the run goes on; a member whose migrate or seed fails is named and the next
still runs; a gateway that never answers (10 minutes) touches no database; a `#` import that resolves nowhere is
refused naming the file, at start and on each re-sync.

## Security and tenancy

Loopback-only forwards; the connection string stays in the child's environment.

## Testing strategy

Unit tests per component (P-001 to P-008), each shown to fail with its change reverted; the end-to-end run in the
stackra-demo container with two services on lane 3.

## Rollout

Minor changesets for `@stackra/cli` and `@stackra/runway`, a patch for `@stackra/database`.

## Delegation and risk plan

Claude only; one wave; R2.

## ADRs

none new; implements ADR 0296 decision 3 for dev.

## Docs

The CLI page, English and Arabic.

## Complexity tracking

none
