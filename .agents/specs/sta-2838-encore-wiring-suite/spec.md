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
- **Packages touched**: gen (`encoreEndpoints`, `emitEncoreWiringTest` (environment and database files first), `emitWiringTierConfig`, two constants, three
  types, `emitEncoreApi` reading its rows from `encoreEndpoints`, `generateMember`, tests); cli (`--tier wiring`,
  `insideEncoreTest`, `withLocalEncoreApp`, `TEST_TIER_VARIABLE`, the `test:wiring` script in `stackra new service`, tests, README); root
  `turbo.jsonc` (the `test:wiring` task); flow-preset (the task vocabulary row, rendered into
  `.agents/rules/task-vocabulary.md`, `.flow/lock.json` updated)
- **Public contract change**: additive. `@stackra/gen` exports `ENCORE_WIRING_TEST`, `ENCORE_WIRING_CONFIG` and
  `emitEncoreWiringTest`; `stackra test` accepts `--tier wiring` and reads `STACKRA_TEST_TIER` when no `--tier` is
  given, and only inside `encore test`; `resolveTool` takes an optional `encoreTest` flag. Nothing existing changes shape; the generated `api.ts` is
  byte-identical.
- **Cross-service events**: none
- **Tenancy and data**: none; the suite sends no valid credential and runs no anonymous action, so it writes nothing
- **Security and privacy**: the suite asserts that every guarded route refuses a call with no credential and one with
  a bearer token that does not verify before it runs (401 or 403 `request_refused`, or 429), the check ADR 0098 relies
  on; `CallAuthenticator` refuses a malformed token without touching the key source (still 401, never a 500)
- **Secrets**: none
- **ADR needed**: no; implements ADR 0182 decision 3 (an enforcement note is added)
- **New dependencies**: none (the suite uses `vitest`, `encore.dev` and `@stackra/vitest-config`, which a service
  already declares; gen writes it only when the member declares `vitest` and `@stackra/vitest-config`)
- **Deploy modes**: same in all three (a test tier; nothing deployed changes)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/developer/cli/README.md`, `apps/docs/src/docs/guides/scaffolding.mdx`,
  `apps/docs/src/docs/standards/testing-by-kind.mdx`, `.agents/rules/task-vocabulary.md`, ADR 0182 enforcement;
  stackra-template's `services/README.md` (its own branch)
- **Lane**: full
- **Change risk**: R1 (a new generated test file and a new CLI tier; one runtime change: `CallAuthenticator` resolves
  the key source only for a well-formed token)

## Acceptance criteria

- **AC-001**: WHEN gen runs on a service THE generator SHALL write `.stackra/tests/encore-wiring.test.ts` and
  `.stackra/vitest.wiring.config.ts` when the service runs as a generated Encore app (no authored `src/main.ts`, its
  `encore.service.ts` written) and declares `vitest` and `@stackra/vitest-config`, and for any other member neither.
- **AC-002**: THE suite SHALL check that the Encore service is declared with the member's name and that the server app
  boots from the root module and the generated wiring.
- **AC-003**: THE suite SHALL list one route per endpoint the generated `api.ts` declares (both read from
  `encoreEndpoints`, so they cannot disagree), answer each route's CORS preflight with 204, and, for each route no
  anonymous caller may reach, expect the call refused before it runs, without a credential and with a bearer token
  that does not verify: 401 `request_refused` from authentication, the same refusal as 401 or 403 from a request
  guard that runs first (ADR 0437's order), or 429 `rate_limited` from a rate-limiting guard; never a 2xx or a 500.
- **AC-004**: THE suite SHALL check that every other generated endpoint is exported and every generated `CronJob`,
  `Topic` and `Subscription` is constructed by the Encore runtime.
- **AC-005**: WHEN the service has a database, THE suite SHALL check it answers and that every model table of the
  manifest exists after the migrations.
- **AC-006**: WHEN `stackra test --tier wiring` runs in a service THE CLI SHALL generate, then start `encore test` with
  `STACKRA_TEST_TIER=wiring`, and the `stackra test` Encore starts SHALL read the tier from that variable, skip gen
  and run Vitest with `.stackra/vitest.wiring.config.ts` (a `--tier` on the command line wins over the variable; at
  the workspace root it runs `turbo run test:wiring`; outside a service, or before gen wrote the config, it refuses,
  naming why).
- **AC-007**: WHEN `stackra new service` writes a service THE CLI SHALL give it a `test:wiring` script
  (`stackra test --tier wiring`).
- **AC-008**: IF the wiring tier is misrouted THEN THE CLI SHALL refuse it (`STACKRA_TEST_TIER` set outside
  `encore test`, or `encore test` exiting 0 without the inner run having started the suite): a usage error that starts nothing for a tier read from the
  variable with no `--tier` and none of Encore's test variables set, never a second `encore test` from a run that
  already carries the variable, and exit 1 naming why when the marker `.stackra/encore-wiring.ran` is absent.
- **AC-010**: WHEN `stackra test --tier wiring` starts `encore test` THE CLI SHALL run the app local-only: the id `""`
  in the member's `encore.app` while Encore runs, gen's file put back when it settles or the process is stopped
  (unless something else rewrote it meanwhile), so the tier needs no Encore Cloud login.
- **AC-011**: THE suite SHALL import the service's generated environment and database files (those gen wrote) before
  the server app, as every generated Encore file does (`encoreSetupImports`, STA-2844).
- **AC-009**: IF a bearer token is malformed THEN THE `CallAuthenticator` SHALL refuse it as unauthenticated (401)
  before it resolves the key source, so the probe is refused even where no `JsonWebKeys` driver is bound.

## Status history

- 2026-11-26 → Clarified (ADR 0182 decision 3; the audit's item 14.2)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md)
- 2026-11-26 → Implementing (built in this branch; unit tests and revert checks green on box 2)
- 2026-11-26 → Implementing (review round 1: AC-003 accepts a guard's refusal, AC-008 stops the recursion and the
  silent pass, AC-009 makes the key source lazy; the `encore test` run, T005, waits for box 2's root disk)
- 2026-11-27 → Implementing (main merged in; the first run under `encore test` stopped on Encore Cloud secrets for the
  linked app id, so the outer run is local-only (AC-010); the suite loads the environment file first (AC-011); T005
  run on box 2: the suite passes on a created app and fails when a guarded adapter is opened)
