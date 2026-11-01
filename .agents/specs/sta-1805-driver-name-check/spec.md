# Specification: a shape's `$Check` leaves out its driver-name fields

**Feature Branch**: `figentra/sta-1805-port-key-brand`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1805

**Clarifications status**: complete

**Input**: Billing round 3 (`billing-service-entitlements`): `.stackra/gen/schemas/entitlements.ts(18,48)` TS2344 on
`EffectiveSetOptions$Check`. Gen emits `z.enum(["records"])` for a `DriverName<ModuleInstalls>` field, but
`DriverName<P>` narrows only when `P` carries a type-only `~key` brand, and nothing writes one, so the field type is
every registered driver name and `Same<>` fails.

## Decision

The issue proposed writing the brand onto each port by module augmentation. That augments the port through the
specifier gen imports it from, often a barrel that re-exports it, where TypeScript does not merge an augmentation and a
wrong merge would break typecheck in every member. Instead the check compares everything but the driver-name fields:
their runtime check is the `z.enum` of the names gen found, and their compile-time check stays `DriverName<P>` on the
class field, which still refuses a name no registered driver has.

## Impact

- **Apps touched**: none
- **Services touched**: none in core; consumers' generated schemas change on their next gen
- **Packages touched**: `packages/developer/gen` (`emit-schemas.function.ts`, its test)
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no (generated output; ADR 0294 decision 19 unchanged)
- **New dependencies**: none
- **Deploy modes**: all, no change
- **Licence tier**: free
- **Docs to update**: none
- **Lane**: lite
- **Change risk**: R1 (generated type check only)

## Requirements

- **FR-001** `X$Check` omits a shape's `driver_name` fields from both sides of `Same<>`.
- **FR-002** The `X$` schema still validates the field with `z.enum` of the driver names.
- **FR-003** A test: a shape with a driver-name field prints the check with that field omitted on both sides.

## Status history

- 2026-11-01 → Clarified (gate finding)
