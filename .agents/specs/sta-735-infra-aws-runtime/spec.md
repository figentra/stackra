# Feature Specification: `@stackra/infra-aws-runtime`: a runtime stack one service deploys through

**Feature Branch**: `figentra/sta-666-wave11`

**Created**: 2026-10-26

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-735

**Clarifications status**: complete

**Input**: A runtime stack that one OS service can deploy through, and a health driver.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/infrastructure/infra-aws-runtime`
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

- **FR-001**: `planForMembers(plan, members)` keeps the members' queues, caches and buckets and the shared cache.
- **FR-002**: `runtimeNetwork(root, env)` reads `shared.network.subnetIds` and `securityGroupIds` (ids or `ref:`), both required.
- **FR-003**: `awsRuntimeStack({ directory, environment, members? })` reads the runways, narrows the plan, resolves the network through the stack config and declares the resources.
- **FR-004**: `AwsRuntimeHealthIndicatorDriver` checks the region's SQS endpoint.

## Success Criteria

- **SC-001**: Every new symbol has a test beside it: `src/core/functions/__tests__/{plan-for-members,runtime-network}.function.test.ts`, `src/node/functions/__tests__/aws-runtime-stack.function.test.ts`.
- **SC-002**: `pnpm verify` is green for the members (run in the separate testing workflow).

## Out of scope

The staging deploy of a real OS service (owner, `pulumi up`); the database and network stacks.

## Status history

- 2026-10-26 · — → Implementing · Claude (wave 11 builder) · spec written with the change (owner mode).
