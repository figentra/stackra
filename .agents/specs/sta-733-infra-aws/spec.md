# Feature Specification: `@stackra/infra-aws`: backups in the jurisdiction, static egress addresses, health driver

**Feature Branch**: `figentra/sta-666-wave11`

**Created**: 2026-10-26

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-733

**Clarifications status**: complete

**Input**: Check the backup-account and egress code and add what is missing: backups stay in the jurisdiction, static egress IPs published for partner allow-lists, and a status page.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/infrastructure/infra-aws`; the status page lands in `packages/infrastructure/infra-observability` (ADR 0185)
- **Cross-service events**: none
- **Tenancy and data**: none in code; every value is runway data or a tenant setting
- **Secrets**: none; ids are `ref:<path>` values from the stack config, CLIs use their own login
- **ADR needed**: ADR 0402 (new)
- **New dependencies**: none
- **Deploy modes**: SaaS
- **Licence tier**: free (MIT)
- **Docs to update**: the package README
- **Lane**: lite
- **Change risk**: R3 (data residency, allow-listed addresses)

## Clarifications

### Session 2026-10-26

Owner mode (develop now, test later): code and tests are written, nothing is run; agents never run Pulumi, a deploy
CLI or anything that touches a cloud account.

## Requirements

- **FR-001**: `awsBaselineConfig` refuses backups or replicated files for an environment whose AWS regions are not `providers.aws.region`, and names the jurisdiction from the runway `regions`.
- **FR-002**: `shared.network.egress.staticIps` (1 to 10) holds that many Elastic IPs, retained on delete; `egressIps` and `egressAllocationIds` are exported.
- **FR-003**: `AwsHealthIndicatorDriver` checks the region's STS endpoint.

## Success Criteria

- **SC-001**: Every new symbol has a test beside it: `src/core/functions/__tests__/aws-baseline-config.function.test.ts`, `src/node/functions/__tests__/aws-baseline.function.test.ts`, `src/core/drivers/__tests__/aws-health-indicator.driver.test.ts`.
- **SC-002**: `pnpm verify` is green for the members (run in the separate testing workflow).

## Out of scope

The NAT gateways that use the addresses (network stack or Encore Cloud); one account per product and region created through Organizations (management account).

## Status history

- 2026-10-26 · — → Implementing · Claude (wave 11 builder) · spec written with the change (owner mode).
