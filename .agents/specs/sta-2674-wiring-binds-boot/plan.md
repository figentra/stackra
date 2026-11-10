# Implementation Plan: the wiring binds the services the generated boot resolves

**Spec**: `.agents/specs/sta-2674-wiring-binds-boot/spec.md` · **Linear**: STA-2674 · **Date**: 2026-11-10

**Input**: Feature specification from `.agents/specs/sta-2674-wiring-binds-boot/spec.md`

## Summary

A constant, `BOOT_SERVICES`, lists the services the generated boot resolves for each declared package. In a
service's wiring, each one of a declared package joins the `used` worklist, which binds it with its dependencies from
the package's manifest. The golden trees of the fixtures that carry the outbox manifest show the new rows.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/developer/gen` (developer)
- **Testing**: vitest in `src/**/__tests__/` and the gen golden files, on CI; goldens regenerated on the Testbed
- **Storage**: none
- **Runtime target**: every service's generated wiring

## Constitution Check

| Law                                   | Result | Note                                 |
| ------------------------------------- | ------ | ------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | no new import between members        |
| Secrets (ADR 0009)                    | N/A    | none                                 |
| Security                              | N/A    | none                                 |
| HTTP and events                       | PASS   | the outbox and inbox run as declared |
| Tenancy                               | N/A    | none                                 |
| Delegation                            | PASS   | Claude only                          |
| Not built yet (ADR 0011)              | N/A    | none                                 |
| Test placement (ADR 0022)             | PASS   | tests stay in `__tests__/`           |
| Versions and catalogs                 | PASS   | a changeset patches @stackra/gen     |
| Deploy modes (ADR 0076)               | PASS   | same in all three                    |
| Licence tier (ADR 0077)               | PASS   | free, MIT                            |
| Docs and ADRs                         | N/A    | no rule changes                      |

## Deploy modes

| Mode       | Behaviour                                        |
| ---------- | ------------------------------------------------ |
| SaaS       | a service with an outbox boots and relays events |
| On-prem    | a service with an outbox boots and relays events |
| Air-gapped | a service with an outbox boots; no call added    |

## Correctness properties

- **P-001**: a service declaring `@stackra/outbox` has wiring rows for `OutboxWriterService`, `OutboxRelayService`,
  `InboxService` and `EventBus` — Validates: AC-001
- **P-002**: the cross-app-consumer golden binds `InboxService` once its catalogue declares `@stackra/database` —
  Validates: AC-002

## Architecture overview

`emitBoot` and `emitWiring` both read the member's declared packages. `emitWiring`'s `used` worklist binds each
reached package service from `dependencyServices(ir)`; the boot-resolved services now enter it from `BOOT_SERVICES`.

## Components and responsibilities

- `BOOT_SERVICES`: the packages and the services boot resolves for them.
- `emitWiring`: adds those of declared packages to `used`.

## Files and folders

```text
packages/developer/gen/
  src/core/constants/boot-services.constant.ts
  src/core/functions/emit-wiring.function.ts
  src/core/functions/__tests__/emit-wiring.function.test.ts
  __golden__/cross-app-consumer/input/services/catalogue/package.json.golden
  __golden__/*/expected/services/*/.stackra/gen/wiring.ts.golden
.changeset/gen-wiring-binds-boot.md
```

## Data models and migrations

none

## Contracts

none changed.

## Error handling

A boot that resolved an unbound service failed with "Nothing binds …"; it now resolves. A declared package whose
manifest lacks the service is unchanged (no row, as before).

## Security and tenancy

none

## Testing strategy

- AC-001: the wiring emitter test with a service declaring the outbox.
- AC-002: the cross-app-producer and cross-app-consumer golden trees (the fixtures that carry the outbox manifest).

## Rollout

A patch changeset for `@stackra/gen`, in 0.33.1; a service regenerates once.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2: the golden diff shows every added row.

## ADRs

none

## Docs

none

## Complexity tracking

none
