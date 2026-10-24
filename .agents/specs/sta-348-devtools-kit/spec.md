# Feature Specification: `@stackra/devtools-kit`, the devtools tab and RPC registry

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: resolved (ADR 0246 sets what devtools show and where; ADR 0127 2026-10-24 note places
`devtools-kit` in `developer` with the `.` entry only; ADR 0084: tabs only where a package needs one)

**Input**: Build `@stackra/devtools-kit` (developer) for real: the devtools tab and RPC registry that each package's
devtools entry fills and that one host (the app panel or the `stackra dev` console) reads.

## Impact

- **Apps touched**: none (the template imports nothing from this package)
- **Services touched**: none
- **Packages touched**: `packages/developer/devtools-kit` (new member)
- **Cross-service events**: none; the kit only observes the in-process bus
- **Tenancy and data**: none stored; event payloads and tab data pass through in memory, in development only
- **Secrets**: none
- **ADR needed**: no (ADR 0246, ADR 0127 2026-10-24 note, ADR 0084)
- **New dependencies**: none outside the workspace (`@stackra/events`, `@stackra/container`, `@stackra/contracts`)
- **Deploy modes**: development; staging for operators; never in production builds (ADR 0246 decision 1)
- **Lane**: full (a new package)
- **Change risk**: R1 (new public contract, development only)

## User Scenarios & Testing

### User Story 1 - A package defines tabs and RPC functions (Priority: P1)

**Independent Test**: `src/core/services/__tests__/devtools-kit.service.test.ts` ("tabs", "RPC functions").

**Acceptance Scenarios**:

1. **Given** tabs defined with `order` values, **When** `kit.tabs()` is read, **Then** they come sorted by `order` then
   id, without their read functions.
2. **Given** a second definition with the same id or name, **Then** it replaces the first, and the first remover does
   nothing.
3. **Given** an id, name or channel that is not dotted lowercase segments, **Then** `DevtoolsError("invalid_name")`.

### User Story 2 - The stream carries package events and the bus timeline (Priority: P1)

**Independent Test**: `src/core/services/__tests__/devtools-kit.service.test.ts` ("stream").

**Acceptance Scenarios**:

1. **Given** `kit.emit(channel, payload)`, **Then** the entry is frozen, sequenced and stamped by the Clock port.
2. **Given** more than 500 entries, **Then** replay keeps the newest 500.
3. **Given** an event dispatched and drained on the `EventBus`, **Then** it appears on `DEVTOOLS_BUS_CHANNEL` with its
   class name, the event and its metadata.

### User Story 3 - One host attaches and reads the kit (Priority: P1)

**Independent Test**: `src/core/services/__tests__/devtools-kit.service.test.ts` ("host").

**Acceptance Scenarios**:

1. **Given** an attached host, **When** another attaches, **Then** `DevtoolsError("host_attached")`; after `detach()` it
   may.
2. **Given** a sensitive tab, **Then** a host without `acceptsSensitive` neither lists nor reads it (`unknown_tab`).
3. **Given** an RPC name, **Then** `session.call` runs it with the host's arguments; an unknown name rejects with
   `unknown_rpc`.
4. **Given** registry changes and new entries, **Then** the host's callbacks receive them; a callback that throws never
   reaches the caller.
5. **Given** a detached session, **Then** every method fails with `detached` and nothing more is pushed.

## Requirements

- **FR-001**: Entry `.` only (ADR 0127 2026-10-24 note); one symbol per entry.
- **FR-002**: `.` exports `DevtoolsKit`, `DevtoolsError`, `DEVTOOLS_BUS_CHANNEL` and the types `DevtoolsAttachment`,
  `DevtoolsBusOccurrence`, `DevtoolsErrorCode`, `DevtoolsEvent`, `DevtoolsHost`, `DevtoolsRemover`, `DevtoolsRpcHandler`,
  `DevtoolsSession`, `DevtoolsTabDefinition`, `DevtoolsTabMetadata`.
- **FR-003**: `DevtoolsKit` is a `Service` whose dependencies are its constructor types (`EventBus`, `Clock`), so gen
  wires it and a package's devtools service takes it by type.
- **FR-004**: No UI, no transport, no Node import.
- **FR-005**: Template contract: the template imports nothing from `@stackra/devtools-kit`; nothing to satisfy beyond
  the registry row ("Devtools tab and RPC registry", entry `.`, depends on events).

## Success Criteria

- **SC-001**: Every symbol the registry row names (tab registry, RPC registry) and the bus streaming of ADR 0246 exist.
- **SC-002**: Every public symbol has a test in a `__tests__/` folder beside it.
- **SC-003**: `pnpm verify` green for the member (run in the separate testing workflow).

## Out of scope

- The host UIs: the app's floating panel and the `stackra dev` console (ADR 0246 decisions 2 and 3).
- Stripping devtools entries from production bundles and the validator check (ADR 0246 enforcement, planned).
- Method decorators for tabs and RPC functions (no decorator row in ADR 0294/0305; packages call the kit directly).
- Payload redaction: tabs use `sensitive`; a redaction policy waits for a host that leaves the developer's machine.
