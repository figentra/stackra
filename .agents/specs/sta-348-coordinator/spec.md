# Feature Specification: `@stackra/coordinator` wave 3, tab leader election and tab locks

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/coordinator` (state, wave 3) for real: tab leader election through Web Locks, with a fallback.

## Impact

- **Apps touched**: none (no authored template file imports the package; see Out of scope for the gen samples)
- **Services touched**: none
- **Packages touched**: `packages/state/coordinator` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none; no storage, no tables
- **Secrets**: none
- **ADR needed**: no (ADR 0084, 0079 decision 6, 0103, 0127 2026-10-24 note, 0294 decision 15)
- **New dependencies**: none new; `@stackra/contracts`, `@stackra/state` through `workspace:*`; React (`catalog:frontend`)
  as a peer, because `signal` is exported from `@stackra/state/react`
- **Deploy modes**: same in all; no outbound call (air-gapped safe)
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/state/coordinator/README.md`, `packages/state/coordinator/AGENTS.md`; ADR 0079, 0084, 0103, 0120, 0127, 0294 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R2 (client coordination; a double leader on the fallback is tolerated by idempotent work)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Registry v3.1 row: entry `.`, depends on state, no authored template import;
  ADR 0084 coordinator row: leader election and locks on `@stackra/state`; ADR 0079 decision 6; ADR 0103: client side
  only, no code shared with `@stackra/locking`

## User Scenarios & Testing

### User Story 1 - One tab leads (Priority: P1)

The offline queue calls `electLeader("query.queue")` in every tab and drains only while `isLeader` is `true`. When the
leading tab closes or resigns, another tab takes over.

**Independent Test**: `src/core/functions/__tests__/elect-leader.function.test.ts`,
`src/core/functions/__tests__/elect-by-web-locks.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** two participants of one name, **Then** exactly one leads; **When** it resigns, **Then** the other leads.
2. **Given** a follower, **When** it awaits `whenLeader()` and the leader resigns, **Then** the promise resolves.
3. **Given** a follower that resigns first, **Then** its pending `whenLeader()` rejects.

### User Story 2 - Fallback without Web Locks (Priority: P1)

Where `navigator.locks` is missing, a BroadcastChannel heartbeat elects the leader; where that is missing too, an
in-memory queue does.

**Independent Test**: `src/core/functions/__tests__/elect-by-broadcast-channel.function.test.ts`,
`src/core/functions/__tests__/elect-in-memory.function.test.ts`,
`src/core/functions/__tests__/detect-election-method.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** a lone tab, **Then** it leads after three missed heartbeats.
2. **Given** a leader that resigns, **Then** a follower that heard it leads at once.
3. **Given** a silent leader, **Then** a follower leads after three missed heartbeats.
4. **Given** two leaders at once, **Then** the higher id steps down on the next heartbeat.

### User Story 3 - One task at a time (Priority: P2)

`withTabLock("identity.refresh", refresh)` runs `refresh` in one tab at a time and releases when it settles.

**Independent Test**: `src/core/functions/__tests__/with-tab-lock.function.test.ts`.

1. **Given** two calls of one name, **Then** the second task starts after the first settles.
2. **Given** a task that throws, **Then** the lock is released and the error propagates.

## Requirements

- **FR-001**: One entry, `.` (registry row, ADR 0294 decision 15).
- **FR-002**: `.` exports `electLeader`, `withTabLock`, `ElectionMethod` and the types `LeaderElection` and
  `ElectLeaderOptions`, nothing else.
- **FR-003**: The method is Web Locks, else BroadcastChannel, else memory, unless `options.method` names one;
  `LeaderElection.method` reports it.
- **FR-004**: `LeaderElection.isLeader` is the read half of a `@stackra/state` signal, so `useSignal` reads it.
- **FR-005**: The BroadcastChannel heartbeat is `options.heartbeat` (a `Duration`, default one second); takeover after
  three missed beats or at once on a resignation; the lower participant id wins a tie.
- **FR-006**: Lock and channel names are prefixed `stackra.coordinator:`.

## Success Criteria

- **SC-001**: The registry row is met: tab leader election, Web Locks with a fallback, entry `.`, built on state. No
  authored template file imports the package, so no template symbol is owed.
- **SC-002**: Every public symbol has a test beside it; the barrel test pins the entry's exports.
- **SC-003**: Lint and format pass on the member (tests, typecheck and build run in the separate testing workflow).

## Out of scope (named, not built)

- `BroadcastChannelQueueLeaderDriver` and `MemoryQueueLeaderDriver`, which the template's committed gen sample
  (`apps/console/.stackra/gen/wiring.ts`) loads from `@stackra/coordinator/browser` and `@stackra/coordinator`: they
  implement the `QueueLeader` port of `@stackra/query/contracts`, which is not built (W6), and the registry row lists no
  `./browser` entry. When query lands, each is a thin `Driver(QueueLeader)` over `electLeader`; where they live is an
  owner call (registry row versus gen sample).
- A `pagehide` hook inside the package: a bfcache restore would leave a resigned election behind; the caller resigns.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
