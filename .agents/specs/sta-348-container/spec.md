# Feature Specification: `@stackra/container` wave 1b, the DI container and kind machinery

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/container` (foundation, wave 1b) for real: classes as the only tokens, the container that
boots gen-written wirings with no reflect-metadata, the kind bases `Module`, `Service`, `Explorer`, `Driver(Port)`,
the helpers every kind package builds on (`createKind`, `registerKind`, `kindOf`, `createDecorator`, `WithPartner`),
`Lifetime`, `Named`, `DiscoveryService`, a React provider and the testing module.

## Impact

- **Apps touched**: none (the template's apps consume `./react`, STA-344)
- **Services touched**: none
- **Packages touched**: `packages/foundation/container` (new member); `packages/tooling/oxlint` (`boundaries.jsonc` allows the container's imports)
- **Cross-service events**: none
- **Tenancy and data**: none (the container holds instances; it stores and logs no data)
- **Secrets**: none
- **ADR needed**: no (ADR 0263 and 0294 decisions 6, 16, 17, 25 decide the model; ADR 0305 rules 2, 3, 8, 42 to 46;
  ADR 0269 decision 3 puts the testing module here; ADR 0127 and 0227 2026-10-24 notes)
- **New dependencies**: none new; `@stackra/contracts` through `workspace:*`; React as an optional peer from
  `catalog:frontend`
- **Deploy modes**: same in all; isomorphic core, `./testing` node only
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/foundation/container/README.md`, `packages/foundation/container/AGENTS.md`; ADR 0120, 0127, 0227, 0263, 0269, 0294, 0305 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R3 (every member boots through it: a wrong resolution or a missed driver is a boot or runtime defect)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Owner, 2026-10-24: `Port` and `Enum` live in `@stackra/contracts`;
  `UnresolvedPortError` is a plain `Error`; `Module` and `Service` live here; the kind helper is `createKind`; the ADR
  0227 note allowing build-time wiring landed in #130

## User Scenarios & Testing

### User Story 1 - Author kinds by base class (Priority: P1)

An author writes `class LoyaltyService extends Service`, `class LoyaltyKitModule extends Module({ exports: [...] })`,
`class MemoryLoyaltyLedgerDriver extends Driver(LoyaltyLedger)` and `class AccessLogExplorer extends Explorer`.

**Independent Test**: `src/core/bases/__tests__/*.base.test.ts`, `src/core/functions/__tests__/create-kind.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** `Module`, **When** used bare and called, **Then** both forms extend, `instanceof Module` holds, statics
   inherit and `kindOf` reads the options of the called form.
2. **Given** `Driver(Port)`, **When** a driver extends it, **Then** it is an instance of the port and TypeScript makes
   it implement the port's abstract members.
3. **Given** a constructor with injected parameters, **When** it calls `super()`, **Then** it type-checks with
   `useDefineForClassFields: true`.

### User Story 2 - Boot a generated wiring (Priority: P1)

The runtime and the testing module call `Container.create(wirings, { roots, overrides, drivers })`.

**Independent Test**: `src/core/services/__tests__/container.service.test.ts`.

**Acceptance Scenarios**:

1. **Given** a wiring with bindings and `deps`, **When** it boots, **Then** every singleton of the booted modules is
   built with its constructor tokens and no `reflect-metadata` read.
2. **Given** a port with candidates, **When** it boots, **Then** the driver is an override, else the test choice, else
   the config field `selectedBy` names, else the only candidate; otherwise `UnresolvedPortError` (a plain `Error`).
3. **Given** `Lifetime.Request` and `Lifetime.Transient`, **When** resolved, **Then** a request instance lives per
   `forRequest()` and a transient is never cached.
4. **Given** `named(Port, "primary")` in `deps` and a `named` config record, **When** resolved, **Then** the named
   driver is built.
5. **Given** an `Explorer` binding, **When** the container boots, **Then** `onApplicationBootstrap()` runs once after
   every eager binding is built.

### User Story 3 - Ship a decorator package (Priority: P1)

`packages/security/access-log` makes `AccessLogged` with `createDecorator` and finds the decorated instances with
`DiscoveryService.classesWith(AccessLogged)`.

**Independent Test**: `src/core/functions/__tests__/create-decorator.function.test.ts`,
`src/core/services/__tests__/discovery.service.test.ts`.

**Acceptance Scenarios**:

1. **Given** a decorator made for classes of some kinds, **When** applied to another target or kind, **Then** it
   throws a `TypeError` at class definition.
2. **Given** a decorated class, **When** decorated, **Then** no accessor or wrapper is installed.
3. **Given** decorated built instances, **When** `classesWith(D)` runs, **Then** it yields
   `{ instance, className, options }`.

### User Story 4 - Test a module (Priority: P1)

Template tests write `createTestingModule(Module).override(Port, fake).useDrivers("memory" | map).compile()` and read
`app.get`, `app.has`, `app.modules`, `app.close`; config and actions add `.withConfig`, `.withSecrets`, `.seed`, `.as`
by plugin.

**Independent Test**: `src/testing/**/__tests__/*.test.ts`.

## Requirements

- **FR-001**: Entries `.`, `./react`, `./testing` only (ADR 0294 d15, ADR 0127 note).
- **FR-002**: `.` exports `Container`, `DiscoveryService`, `Driver`, `DriverName` (t), `Explorer`, `Lifetime`,
  `Module`, `Named` (t), `Service`, `UnresolvedPortError`, `Wiring` (t), `createDecorator`, `named` (template), and
  `createKind`, `registerKind`, `kindOf`, `WithPartner` (t), `Replaces`, `DriverRegistry` (t) (registry row).
- **FR-003**: `./react` exports `ContainerProvider`; `./testing` exports `createTestingModule`, `TestingApp`,
  `registerWiring`, `registerTestingPlugin`.
- **FR-004**: No export named `Injectable`, `Inject`, `defineToken` or `Provider`; no `reflect-metadata` dependency.
- **FR-005**: `UnresolvedPortError` extends `Error` only.
- **FR-006**: The kind helper is `createKind` (ADR 0305 r3 reserves `define`).
- **FR-007**: Runtime dependency `@stackra/contracts` only.

## Success Criteria

- **SC-001**: Every symbol the template imports from `@stackra/container`, `/react` and `/testing` exists with the
  shape the template uses (the loyalty-kit and access-log wirings satisfy `Wiring`).
- **SC-002**: A test beside every public symbol, plus the barrel tests, passes in the testing workflow.
- **SC-003**: The kind-base and partner spike cases are ported as tests (type tests for the negative partner cases).

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
