# Feature Specification: an Encore wiring suite for the generated app

**Feature Branch**: `figentra/sta-2838-encore-wiring-suite`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: the CTO (the change risk's approval stop)

**Linear**: STA-2838

**Clarifications status**: complete

**Input**: ADR 0182 decision 3 says a thin Encore test suite covers the wiring. Nothing does: the generated Encore app
of a service (the Encore service declaration, `api.ts`, the CronJobs, topics, subscriptions, the database and the
boot from the root module) serves traffic, and no package runs `encore test`. A route gen forgot, an adapter that
lets a call through without a credential, a topic Encore never constructed or a migration that never ran are found
only in a deployed environment. The 26 Nov production-readiness audit (batch 14, item 14.2) lists it; STA-2838 was
split out of STA-229 to build it.

### Sources

- `apps/docs/src/docs/adr/0182-testing-strategy-v2-tiers-coverage-infrastructure-and-policies.mdx` (decision 3)
- `packages/developer/gen/src/core/functions/emit-encore-api.function.ts` (the adapters the suite calls)
- `packages/developer/gen/src/core/functions/generate-member.function.ts`
- `packages/developer/cli/src/node/functions/resolve-tool.function.ts`, `tool-command.function.ts`
- Encore 1.58.8: `encore test` runs the app's `test` script with the runtime configuration and app metadata in the
  environment (`ENCORE_RUNTIME_CONFIG`, `ENCORE_APP_META` or their `_PATH` forms) and a migrated test database

## Impact

- **Apps touched**: docs (the scaffolding guide, the testing-by-kind standard, an enforcement note in ADR 0182)
- **Services touched**: none in this repo (its services are placeholders with an authored `src/main.ts`, so gen writes
  them no suite); every service that runs as a generated Encore app gets the suite on its next gen
- **Packages touched**: gen (`encoreEndpoints`, `emitEncoreWiringTest`, `emitWiringTierConfig`, two constants, three
  types, `emitEncoreApi` reading its rows from `encoreEndpoints`, `generateMember`, tests); cli (`--tier wiring`,
  `insideEncoreTest`, `TEST_TIER_VARIABLE`, the `test:wiring` script in `stackra new service`, tests, README); root
  `turbo.jsonc` (the `test:wiring` task); flow-preset (the task vocabulary row, rendered into
  `.agents/rules/task-vocabulary.md`, `.flow/lock.json` updated)
- **Public contract change**: additive. `@stackra/gen` exports `ENCORE_WIRING_TEST`, `ENCORE_WIRING_CONFIG` and
  `emitEncoreWiringTest`; `stackra test` accepts `--tier wiring` and reads `STACKRA_TEST_TIER` when no `--tier` is
  given; `resolveTool` takes an optional `encoreTest` flag. Nothing existing changes shape; the generated `api.ts` is
  byte-identical.
- **Cross-service events**: none
- **Tenancy and data**: none; the suite sends no valid credential and runs no anonymous action, so it writes nothing
- **Security and privacy**: the suite asserts that every guarded route refuses a call with no credential and one with
  a bearer token that does not verify (401 `request_refused`), the check ADR 0098 relies on
- **Secrets**: none
- **ADR needed**: no; implements ADR 0182 decision 3 (an enforcement note is added)
- **New dependencies**: none (the suite uses `vitest`, `encore.dev` and `@stackra/vitest-config`, which a service
  already declares; gen writes it only when the member declares `vitest` and `@stackra/vitest-config`)
- **Deploy modes**: same in all three (a test tier; nothing deployed changes)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/developer/cli/README.md`, `apps/docs/src/docs/guides/scaffolding.mdx`,
  `apps/docs/src/docs/standards/testing-by-kind.mdx`, `.agents/rules/task-vocabulary.md`, ADR 0182 enforcement
- **Lane**: full
- **Change risk**: R1 (a new generated test file and a new CLI tier; runtime code is unchanged)

## Acceptance criteria

- **AC-001**: WHEN gen runs on a service that runs as a generated Encore app (no authored `src/main.ts`, its
  `encore.service.ts` written) and declares `vitest` and `@stackra/vitest-config`, THE generator SHALL write
  `.stackra/tests/encore-wiring.test.ts` and `.stackra/vitest.wiring.config.ts`; for any other member it SHALL write
  neither.
- **AC-002**: THE suite SHALL check that the Encore service is declared with the member's name and that the server app
  boots from the root module and the generated wiring.
- **AC-003**: THE suite SHALL list one route per endpoint the generated `api.ts` declares (both read from
  `encoreEndpoints`, so they cannot disagree), answer each route's CORS preflight with 204, and, for each route no
  anonymous caller may reach, expect 401 `request_refused` for a call without a credential and for one whose bearer
  token does not verify.
- **AC-004**: THE suite SHALL check that every other generated endpoint is exported and every generated `CronJob`,
  `Topic` and `Subscription` is constructed by the Encore runtime.
- **AC-005**: WHEN the service has a database, THE suite SHALL check it answers and that every model table of the
  manifest exists after the migrations.
- **AC-006**: `stackra test --tier wiring` in a service SHALL generate, then start `encore test` with
  `STACKRA_TEST_TIER=wiring`; the `stackra test` Encore starts SHALL read the tier from that variable, skip gen, and run
  Vitest with `.stackra/vitest.wiring.config.ts`. A `--tier` on the command line wins over the variable. At the
  workspace root it SHALL run `turbo run test:wiring`. Outside a service, or before gen wrote the config, it SHALL
  refuse, naming why.
- **AC-007**: `stackra new service` SHALL write a `test:wiring` script (`stackra test --tier wiring`).

## Status history

- 2026-11-26 → Clarified (ADR 0182 decision 3; the audit's item 14.2)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md)
- 2026-11-26 → Implementing (built in this branch; unit tests and revert checks green on box 2)
