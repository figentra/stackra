# Feature Specification: `@stackra/runway`: Encore Cloud and EAS providers, promote, rollback, KSA and dedicated deployments

**Feature Branch**: `figentra/sta-666-wave11`

**Created**: 2026-10-26

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-790

**Clarifications status**: complete

**Input**: Finish the deploy half of `@stackra/runway`: the provider port of ADR 0352 decision 3 with Encore Cloud and EAS drivers, `promote` and `rollback`, a KSA in-country environment on GCP, and a `dedicated` environment profile.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/developer/runway`; `tools/schemas/runway-root.schema.json` (byte copy of the package schema)
- **Cross-service events**: none
- **Tenancy and data**: none in code; every value is runway data or a tenant setting
- **Secrets**: none; ids are `ref:<path>` values from the stack config, CLIs use their own login
- **ADR needed**: ADR 0400 (new)
- **New dependencies**: none
- **Deploy modes**: SaaS
- **Licence tier**: free (MIT)
- **Docs to update**: the package README
- **Lane**: lite
- **Change risk**: R2 (deploy path; no cloud is called by code or tests)

## Clarifications

### Session 2026-10-26

Owner mode (develop now, test later): code and tests are written, nothing is run; agents never run Pulumi, a deploy
CLI or anything that touches a cloud account.

## Requirements

- **FR-001**: `RunwayProvider` port: `plan`, `apply`, `verify`, `rollback`, `current`; drivers in `./node` run the destination CLI through a `CommandRunner` with no shell.
- **FR-002**: `EncoreCloudProviderDriver`: push to `encore://<app>` on the branch the runway names (environment, region or dedicated block); force-push on rollback; verify reads the branch.
- **FR-003**: `EasProviderDriver`: `eas build` of the channel's profile (default) or `eas update` (`targets.eas.release: update`) from the release checkout; verify by build status or update group; republish on rollback; refuse a store-build rollback.
- **FR-004**: `deployTargets`: kinds in build order, regions in release order, then each dedicated tenant's services.
- **FR-005**: `deploy` applies and verifies in order and stops at the first `down` target; `promote` requires `deploy.on: promote` on the target and ships what the source runs (or a given commit); `rollback` needs every target's earlier record before touching any.
- **FR-006**: Root runway: `environments.<env>.cloud: { name, account }` and `environments.<env>.dedicated.<key>: { tenant, cloud, regions?, encore? }` in the zod and both JSON copies; `checkRegions` reports `cloud_unconfigured` and `unknown_account`.

## Success Criteria

- **SC-001**: Every new symbol has a test beside it: `src/core/functions/__tests__/{deploy-targets,deploy,promote,rollback,check-regions}.function.test.ts`, `src/node/drivers/__tests__/*.driver.test.ts`, `src/node/functions/__tests__/run-command.function.test.ts`.
- **SC-002**: `pnpm verify` is green for the members (run in the separate testing workflow).

## Out of scope

Helm and Zarf output (first on-prem prospect); the `stackra runway` CLI commands (STA-607, `@stackra/cli`); `pnpm validate` comparing the two schema copies (`tools/scripts`); writing release records (the caller's).

## Status history

- 2026-10-26 · — → Implementing · Claude (wave 11 builder) · spec written with the change (owner mode).
