# Feature Specification: Infra packages: a `HealthIndicator` driver per package

**Feature Branch**: `figentra/sta-666-wave11`

**Created**: 2026-10-26

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-741

**Clarifications status**: complete

**Input**: Each infra package ships its own health indicator driver (contracts `HealthIndicator` port).

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `infra-aws`, `infra-aws-runtime`, `infra-gcp`, `infra-cloudflare`, `infra-github`, `infra-identity`, `infra-mobile`, `infra-observability`
- **Cross-service events**: none
- **Tenancy and data**: none in code; every value is runway data or a tenant setting
- **Secrets**: none; ids are `ref:<path>` values from the stack config, CLIs use their own login
- **ADR needed**: ADR 0402 (new)
- **New dependencies**: none
- **Deploy modes**: SaaS
- **Licence tier**: free (MIT)
- **Docs to update**: the package README
- **Lane**: lite
- **Change risk**: R1

## Clarifications

### Session 2026-10-26

Owner mode (develop now, test later): code and tests are written, nothing is run; agents never run Pulumi, a deploy
CLI or anything that touches a cloud account.

## Requirements

- **FR-001**: One driver per package in `src/core/drivers/`, exported from `.`: a GET bounded by a timeout (five seconds unless given) to a target the wiring passes from runway data.
- **FR-002**: Below 500 is `up` (429 `degraded`), 500 and above `down`; the identity driver needs a 2xx discovery document; a failed request is `down` with the host only, never a throw.

## Success Criteria

- **SC-001**: Every new symbol has a test beside it: `src/core/drivers/__tests__/*-health-indicator.driver.test.ts` in each package.
- **SC-002**: `pnpm verify` is green for the members (run in the separate testing workflow).

## Out of scope

Binding the drivers in a service's wiring (gen); the probe itself (`@stackra/app`).

## Status history

- 2026-10-26 · — → Implementing · Claude (wave 11 builder) · spec written with the change (owner mode).
