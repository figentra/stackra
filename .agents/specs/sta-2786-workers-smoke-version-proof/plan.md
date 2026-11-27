# Implementation Plan: a Worker deploy smokes the new version at 0% and proves which version answered

**Spec**: `.agents/specs/sta-2786-workers-smoke-version-proof/spec.md` · **Linear**: STA-2786 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2786-workers-smoke-version-proof/spec.md`

## Summary

The `cloudflare-workers` provider stages an uploaded version at 0% beside the serving one, smokes it there through the
version override, then promotes it in the member's rollout with a smoke after every step. Every smoke answer must name
the version under test (`servedVersionProblem`), through the `x-stackra-version` header or the `/-/version` route. The
Workers name their version from a `CF_VERSION_METADATA` binding. Core `rollback()` now rolls back every target before
it throws.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/developer/runway`, `workers/registry`, `workers/turbo-cache`, `workers/edge`, `workers/static`, `apps/docs`, the reusable `runway-cloudflare-workers.yml` workflow and `runway.yaml`
- **Testing**: vitest in `src/**/__tests__/`, with a fake Cloudflare that routes overrides as Cloudflare does
- **Storage**: none
- **Runtime target**: the `stackra deploy` command on the deploy job; the Workers on Cloudflare

## Constitution Check

| Law                                   | Result | Note                                                                     |
| ------------------------------------- | ------ | ------------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | core gains pure data and a pure function; the driver stays in `./node`   |
| Secrets (ADR 0009)                    | PASS   | no new secret; the bearer is still read from a named variable            |
| Security                              | PASS   | the proof only narrows what passes a smoke; no new input is trusted      |
| HTTP and events                       | PASS   | one read-only route `/-/version` on static and docs; one response header |
| Tenancy                               | N/A    | no tenant data; the header and route name a Worker version only          |
| Delegation                            | PASS   | Claude builds; the CTO and an independent reviewer read                  |
| Not built yet (ADR 0011)              | N/A    | everything named here is built in this branch                            |
| Test placement (ADR 0022)             | PASS   | every new test is in `__tests__/`                                        |
| Versions and catalogs                 | PASS   | a minor changeset for `@stackra/runway` with a Breaking section          |
| Deploy modes (ADR 0076)               | PASS   | SaaS only; see Deploy modes                                              |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                                |
| Docs and ADRs                         | PASS   | READMEs, AGENTS and the changeset; implements ADR 0352 and ADR 0536      |

## Deploy modes

| Mode       | Behaviour                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------ |
| SaaS       | every Worker deploy stages at 0%, proves the version at each step and rolls back on a failed one |
| On-prem    | unchanged: the cloudflare-workers provider is not used; the box smoke can reuse the export       |
| Air-gapped | unchanged: the cloudflare-workers provider is not used                                           |

## Correctness properties

- **P-001**: apply deploys `<serving>@100 <new>@0` before the first smoke, and no step above 0% runs before the 0% smoke passes — Validates: AC-001
- **P-002**: a failed 0% smoke ends with `<serving>@100` deployed and no other traffic move — Validates: AC-002
- **P-003**: `servedVersionProblem(expected, answer)` returns `undefined` only when the header, and for a route answer the body's `version`, equal `expected` — Validates: AC-003
- **P-004**: a broken new version that the old order would have promoted to 10% fails at 0% — Validates: AC-001, AC-003
- **P-005**: every rollout step, 100% included, is followed by a smoke, and a failed step puts the previous version back — Validates: AC-004
- **P-006**: a member with an empty `smoke` list is refused before any wrangler command runs — Validates: AC-005
- **P-007**: the member schema defaults `versionProof` to `header`, and the manifest lists `runway.WorkerVersionProof` — Validates: AC-006
- **P-008**: the core entry's export list includes `WORKER_VERSION`, `WorkerVersionProof` and `servedVersionProblem` — Validates: AC-007
- **P-009**: verify of a pre-proof version is up on 2xx plus a 100% deployment, and down when an answer names another version — Validates: AC-008
- **P-010**: `rollback()` calls every provider's rollback before it throws, and the error names each down target — Validates: AC-009
- **P-011**: after a failed 50% or 100% step, `current()` names the commit that serves — Validates: AC-010
- **P-012**: no traffic moves when the holds do not fit before the deadline, and a step's smoke stops before it — Validates: AC-011
- **P-013**: each Worker names its `CF_VERSION_METADATA` id on every answer or on `/-/version` — Validates: AC-012

## Architecture overview

`stackra deploy` hands a Worker member to `CloudflareWorkersProviderDriver`. Apply now runs: build, migrations,
`versions upload`, `versions deploy <serving>@100 <new>@0`, smoke by override, then each rollout step with its hold
and smoke, the last at 100%. Every smoke answer goes through `servedVersionProblem` against the uploaded id. A failed
step deploys the previous version again. Verify proves the recorded version; rollback deploys a recorded version and
verifies it, accepting a pre-proof version only from Cloudflare's own deployment state.

## Components and responsibilities

- `WORKER_VERSION` (core constant): the header name, the `/-/version` route and Cloudflare's override header name.
- `WorkerVersionProof` (core enum, published in the manifest): `header` or `route`.
- `servedVersionProblem` (core function, pure): what is wrong with one answer's proof, or `undefined`.
- `CLOUDFLARE_WORKERS_SETTINGS_SCHEMA`: the member's `versionProof`, defaulting to `header`.
- `CloudflareWorkersProviderDriver`: the 0% stage, the proofs, the stepped promotion, the deadline, the deployment messages, `current()`, verify and rollback.
- Core `rollback()` and `RunwayDeployFailedError`: roll back every target, then one error naming each down target.
- `SmokeAnswer` (node type): what the driver reads of an answer.
- The Workers: a `with-version` wrapper in registry, turbo-cache and edge; a one-route script in static and docs.
- `runway-cloudflare-workers.yml`: sets `RUNWAY_DEPLOY_DEADLINE` 27 minutes after the Release commit step.

## Files and folders

```text
.changeset/workers-smoke-version-proof.md
.github/workflows/runway-cloudflare-workers.yml
runway.yaml
packages/developer/runway/stackra.manifest.json
packages/developer/runway/README.md
packages/developer/runway/AGENTS.md
packages/developer/runway/src/core/index.ts
packages/developer/runway/src/core/constants/worker-version.constant.ts
packages/developer/runway/src/core/constants/cloudflare-workers-settings-schema.constant.ts
packages/developer/runway/src/core/enums/worker-version-proof.enum.ts
packages/developer/runway/src/core/functions/served-version-problem.function.ts
packages/developer/runway/src/core/functions/rollback.function.ts
packages/developer/runway/src/core/errors/runway-deploy-failed.error.ts
packages/developer/runway/src/node/types/smoke-answer.type.ts
packages/developer/runway/src/node/drivers/cloudflare-workers-provider.driver.ts
packages/developer/runway/src/**/__tests__/ (the tests)
apps/docs/AGENTS.md
apps/docs/vitest.config.ts
apps/docs/worker/main.ts
apps/docs/wrangler.jsonc
workers/edge/src/http/with-version.ts
workers/edge/src/interfaces/edge-env.interface.ts
workers/edge/src/main.ts
workers/edge/wrangler.jsonc
workers/registry/README.md
workers/registry/src/http/serve-registry.ts
workers/registry/src/http/with-version.ts
workers/registry/src/interfaces/registry-env.interface.ts
workers/registry/wrangler.jsonc
workers/static/README.md
workers/static/package.json
workers/static/src/worker/main.ts
workers/static/wrangler.jsonc
workers/turbo-cache/README.md
workers/turbo-cache/src/http/index.ts
workers/turbo-cache/src/http/with-version.ts
workers/turbo-cache/src/interfaces/turbo-cache-env.interface.ts
workers/turbo-cache/src/main.ts
workers/turbo-cache/wrangler.jsonc
```

## Data models and migrations

none

## Contracts

- `@stackra/runway` exports, added: `WORKER_VERSION` (frozen object: `header` = `x-stackra-version`, `route` = `/-/version`, `override` = `Cloudflare-Workers-Version-Overrides`); `WorkerVersionProof` (`Enum.of`, values `header`, `route`); `servedVersionProblem(expected: string, answer: { header; route?; body? }): string | undefined`.
- `stackra.manifest.json`, added: `runway.WorkerVersionProof` = string enum `header`, `route`.
- `runway.yaml` schema, added: `targets.cloudflare-workers.members.<key>.versionProof` (optional, default `header`).
- `rollback()`: same signature; now throws after every target is rolled back, naming each down target.
- `RunwayDeployFailedError`: same constructor; the message joins every down result's detail.
- Worker HTTP: `x-stackra-version` on every answer (registry, turbo-cache, edge); `GET /-/version` answering `{ "version": "<id>" }` (static, docs). No other path changes.
- Deploy job environment: `RUNWAY_DEPLOY_DEADLINE` (epoch seconds), optional.

## Error handling

- A failed 0% smoke: `<serving>@100` again, the deploy fails with the proof's message ("answered by version X, not Y").
- A failed later step: the previous version goes back; a failed rollback is reported with the smoke failure and says traffic may still be split.
- `wrangler deployments status` failing with Cloudflare code 10007 means a never-deployed Worker (moved at once); any other failure stops the deploy.
- A member with no smoke check: refused before anything ships.

## Security and tenancy

The header and route expose a Worker version id, which is not secret and names no tenant or person. No secret is added;
the smoke bearer is still read from a named variable and never logged.

## Testing strategy

- AC-001 to AC-005, AC-008, AC-010, AC-011: `cloudflare-workers-provider.driver.test.ts`, its "version proof (STA-2786)" block, against a fake Cloudflare that honours or ignores overrides as Cloudflare does; it reproduces the old false pass on main's order.
- AC-003: `served-version-problem.function.test.ts`.
- AC-006, AC-007: `core/__tests__/index.test.ts` and the `stackra gen --check` manifest check.
- AC-009: `rollback.function.test.ts` and `runway-deploy-failed.error.test.ts`.
- AC-012: the `with-version` tests of registry, turbo-cache and edge, `serve-registry.test.ts`, turbo-cache's and static's `main.test.ts`, and the docs Worker's `main.test.ts`.
- Not provable in tests: wrangler accepting `@0` and the new messages, and the metadata id matching the uploaded id; a real staging Worker deploy confirms both.

## Rollout

A minor changeset for `@stackra/runway`, led by its Breaking section. This repository's Workers adopt it in the same
change. A staging Worker deploy proves wrangler's `@0` before production. Product repositories add a smoke check and the
version header or route before they upgrade.

## Delegation and risk plan

Claude builds; the CTO and an independent Opus reviewer read. R2. Route `spec-task`.

## ADRs

ADR 0352 decision 3 (implemented); ADR 0536 gate 2 (implemented, the ADR lands with STA-2783); ADR 0170 (rollback).

## Docs

The runway README and AGENTS, the registry, static and turbo-cache READMEs, apps/docs AGENTS and the changeset.

## Complexity tracking

none
