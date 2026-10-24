# Feature Specification: `@stackra/contracts` wave 1a, the leaf vocabulary

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: resolved (owner, 2026-10-24: `Port` and `Enum` live here; `define*` and `MigrationRunner`
live here; one `Tone` with ADR 0303's five values; build only what a consumer imports today)

**Input**: Build `@stackra/contracts` (foundation, wave 1a) for real: the leaf every other package imports, with no
workspace dependency. This supersedes the port-everything scope of `sta-74-contracts` (no error kinds, diagnostics,
envelope, pagination or API version here: those belong to errors, gen, events, validation and versioning).

## Impact

- **Apps touched**: none
- **Services touched**: none (the template's services and apps consume it once converted, STA-344)
- **Packages touched**: `packages/foundation/contracts` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none; `Actor` carries a tenant id but the package stores nothing
- **Secrets**: none
- **ADR needed**: no (ADR 0127 2026-10-24 note places the package, its entry and its kind bases)
- **New dependencies**: none at runtime; dev dependencies from existing catalogs and `workspace:*`
- **Deploy modes**: same in all; no I/O, no environment, clock or locale read
- **Lane**: full (a new package)
- **Change risk**: R2 (new public contract every package imports)

## User Scenarios & Testing

### User Story 1 - Declare a closed set once (Priority: P1)

A module author writes `export const OrderStatus = Enum.of({...})` and `export type OrderStatus =
Enum.Value<typeof OrderStatus>`, compares cases with `===`, lists them with `Enum.values` and reads a case's tone with
`Enum.meta`.

**Independent Test**: `src/core/bases/__tests__/enum.base.test.ts`.

**Acceptance Scenarios**:

1. **Given** `Enum.of({ Gold: ["gold", { multiplier: 200 }] })`, **When** the author reads `X.Gold`, **Then** it is the
   string `"gold"`, and `Enum.meta(X, X.Gold).multiplier` is `200`, typed as `200`.
2. **Given** two cases with the same code, **When** `Enum.of` runs, **Then** it throws a `RangeError`.

### User Story 2 - Define a port a host implements (Priority: P1)

A package author writes `abstract class LoyaltyMembers extends Port` and a host binds a driver to it by the class.

**Independent Test**: `src/core/bases/__tests__/port.base.test.ts`, `src/core/ports/__tests__/*.port.test.ts`.

### User Story 3 - Write a member definition (Priority: P1)

Every member's `stackra.config.ts` calls one of `defineApp`, `defineService`, `definePackage`, `defineWorker` with
static data typed by enums (`Target`, `ApiArea`, `MigrationRunner`).

**Independent Test**: `src/core/functions/__tests__/define-*.function.test.ts`.

### User Story 4 - Speak about callers, ids and lengths of time (Priority: P2)

A policy narrows `actor.realm === Realm.Customer` and reads a user id; a config default is `Duration.seconds(60)`; a
branded id has one constructor made by `brand<MemberId>()`; generated code reads `json as StackraManifest`.

**Independent Test**: `src/core/types/__tests__/*.type.test.ts`, `src/core/constants/__tests__/duration.constant.test.ts`.

### Edge Cases

- `Enum.meta` with a code the enum lacks (only unvalidated data can carry one): `RangeError`.
- `Enum.values` on an object `Enum.of` did not build: `TypeError`.
- `Duration` of a negative, `NaN` or infinite amount: `RangeError`. Years and months (`P1Y`, `P1M`) are refused: they
  have no fixed length. Precision is one millisecond; `Duration.seconds(0.0004)` is `PT0S`.
- `Duration.parse("PT600S")` is `Duration.minutes(10)`: one length has one spelling, so equal lengths are `===`.

## Requirements

- **FR-001**: The package SHALL be `@stackra/contracts` at `packages/foundation/contracts`, `tier:lib`, entry `.` only,
  with no workspace dependency at runtime.
- **FR-002**: It SHALL export every symbol the template imports from `@stackra/contracts`: `Actor`(t), `ActorKind`,
  `ApiArea`, `Branded`(t), `Clock`, `DataClassification`, `Duration`, `Email`(t), `HttpMethod`, `IdentityResolver`,
  `Json`(t), `Logger`, `PublicId`(t), `Realm`, `SortDirection`, `StackraManifest`(t), `Target`, `Tone`, `Url`(t),
  `brand`, `Port`, `Enum`, `defineApp`, `defineService`, `definePackage`, `defineWorker`, `MigrationRunner`.
- **FR-003**: Every enum SHALL be an `Enum.of` value plus a type of the same name, with snake_case codes; `HttpMethod`
  keeps HTTP's upper-case tokens (a tool-owned value, as the manifest writes them).
- **FR-004**: `Clock`, `Logger` and `IdentityResolver` SHALL be abstract classes that extend `Port`, carry its
  type-only `~kind` brand and work as constructor tokens.
- **FR-005**: `Duration.*` constructors SHALL be pure and constant-evaluable, and SHALL round-trip ISO 8601.
- **FR-006**: There SHALL be one `Tone` with the five values of ADR 0303 decision 7: default, accent, success,
  warning, danger.
- **FR-007**: `PublicId<P>` SHALL refuse an id of another prefix at compile time; `Branded` SHALL refuse a plain base
  value and another brand.
- **FR-008**: `StackraManifest` SHALL read a committed template manifest (the loyalty-kit fixture) the way generated
  code does (`json as StackraManifest`).

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package.

## Open items (for the owner, not blocking)

- `DataClassification` uses the template's four values (personal, financial, health, pseudonymous); ADR 0134 decision 2
  lists `public`, `internal`, `pii`, `financial`, `secret`, `regulated` for `@Classify`. One of the two needs a note.
- `Actor` carries `kind`, `id`, `realm`, `tenantId` and `onBehalfOf`. ADR 0098's `via` and `credential` and 0211's
  acting-as marker join when the actions and identity packages first read them.
- The `defineApp` tool sections and `defineWorker` stay open records until gen ships their shapes (STA-339).
