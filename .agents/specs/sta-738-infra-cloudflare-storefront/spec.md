# Feature Specification: `@stackra/infra-cloudflare`: storefront waiting room and per-shopper limits

**Feature Branch**: `figentra/sta-666-wave11`

**Created**: 2026-10-26

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-738

**Clarifications status**: complete

**Input**: A storefront waiting room and per-shopper limits on hot items, thresholds as tenant settings.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/infrastructure/infra-cloudflare`
- **Cross-service events**: none
- **Tenancy and data**: none in code; every value is runway data or a tenant setting
- **Secrets**: none; ids are `ref:<path>` values from the stack config, CLIs use their own login
- **ADR needed**: ADR 0402 (new)
- **New dependencies**: none
- **Deploy modes**: SaaS
- **Licence tier**: free (MIT)
- **Docs to update**: the package README
- **Lane**: lite
- **Change risk**: R2

## Clarifications

### Session 2026-10-26

Owner mode (develop now, test later): code and tests are written, nothing is run; agents never run Pulumi, a deploy
CLI or anything that touches a cloud account.

## Requirements

- **FR-001**: `parseStorefront` checks a tenant's campaign settings: shopper cookie or header; per campaign host, path, waiting room (Cloudflare's 200 floors, window, `enabled`) and hot-item limits (accepted periods, plain paths).
- **FR-002**: `storefrontEdge` declares a waiting room and event per campaign, suspended while `enabled` is false, and returns the per-shopper rules.
- **FR-003**: `zoneEdge` appends the per-shopper rules after the per-IP limit in the zone's one `http_ratelimit` entry point; `cloudflareCoreStack` takes `storefront` by zone and refuses a non-edge zone or a foreign host.
- **FR-004**: `CloudflareHealthIndicatorDriver` checks an edge host.

## Success Criteria

- **SC-001**: Every new symbol has a test beside it: `src/core/functions/__tests__/{parse-storefront,shopper-limit-rules}.function.test.ts`, `src/node/functions/__tests__/{storefront-edge,cloudflare-core-stack}.function.test.ts`.
- **SC-002**: `pnpm verify` is green for the members (run in the separate testing workflow).

## Out of scope

The storefront exporting its campaign settings to the edge stack (Commerce); the Cloudflare plan that includes waiting rooms (owner).

## Status history

- 2026-10-26 · — → Implementing · Claude (wave 11 builder) · spec written with the change (owner mode).
