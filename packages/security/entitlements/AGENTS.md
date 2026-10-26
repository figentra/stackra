<!--
Stackra file contract:
Purpose: the agent rules of @stackra/entitlements: where code goes, entries and barrels, package rules.
Boundary: documentation of packages/security/entitlements only.
Runtime: none
Governing contract: ADR 0215; ADR 0294; STA-1225 (grant by key).
-->

# AGENTS — @stackra/entitlements

The `Entitlement` kind, its ports and the plan driver of the pipeline's entitlement step. Member at
`packages/security/entitlements` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts` and
`./testing`.

## Where code goes

| You are writing…              | It goes in…                                 |
| ----------------------------- | ------------------------------------------- |
| The kind base (`Entitlement`) | `src/core/bases/entitlement.base.ts`        |
| A port                        | `src/core/ports/<name>.port.ts`             |
| A driver                      | `src/core/drivers/<name>.driver.ts`         |
| A refusal                     | `src/core/errors/<name>.error.ts`           |
| A function, an enum, a type   | `src/core/{functions,enums,types}/`         |
| A test helper                 | `src/testing/functions/`                    |
| A test                        | `__tests__/<name>.<kind>.test.ts` beside it |

## Entries and barrels

- `src/{core,contracts,testing}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add every new
  public file to its barrel and to that entry's `index.test.ts`.
- `EntitlementUsage` lives in `src/contracts/ports/` and is exported only from `./contracts`. `EntitlementSource`
  lives in `src/contracts/ports/` (its signature names the structural `EntitlementRef` and `EntitlementKey`) and is
  re-exported from `.` and `src/core/ports/` for old imports. `ENTITLEMENT_REGISTRY` stays internal.
- `EntitlementSource#grant` takes a class or a key (STA-1225). A driver turns either into the key with
  `entitlementKey`, never by its own lookup, so a class and its key always answer the same record.

## This package

- Plug into `EntitlementCheck` from `@stackra/actions/contracts`; never add a second gate or reorder the pipeline.
- An entitlement is an option on a kind, never a model trait (final review H, R-61). Keys and label keys are derived;
  never add a `key` option.
- Flags (`@stackra/feature-flags`) and consent (`@stackra/consent`) are separate; a source never answers for them.
- No tenant word here (final review R-59): a grant is keyed by the id of the call's `scope` (the contracts `ScopeRef`),
  read in `PlanEntitlementCheckDriver.check`; never read the descriptor's `tenantId`. The ports keep the id until
  `@stackra/collaboration`, which passes its room's scope id, moves to the `ScopeRef` with them.
- Seat kinds, allowances, grace dates and ceilings are plan-catalogue data; never name a seat kind or a number in code.
- A check that must never pass a limit holds the limit's lock (`LimitReservationService`, `SeatMeterService`).
- No parameter properties and no `#private` fields: apps typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data        | Where                                   | Handling                                                        |
| ----------- | --------------------------------------- | --------------------------------------------------------------- |
| Scope id    | `EntitlementSource`, `EntitlementUsage` | A public id passed to the drivers; never stored or logged here. |
| Plan grants | `LimitReachedError` details             | The entitlement key and the caller's own limit; nothing else.   |
