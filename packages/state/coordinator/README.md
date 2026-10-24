# @stackra/coordinator

Stackra tab coordination: one tab of a device leads a named election (the tab that drains the offline mutation queue,
holds the realtime socket, or refreshes the token), and another takes over when it closes. Web Locks first, with a
BroadcastChannel heartbeat fallback and an in-memory fallback.

**Tier:** `tier:lib` (`packages/state/coordinator`, ADR 0127 2026-10-24 note). Entry `.` only. Depends on
`@stackra/contracts` and `@stackra/state` (the leader flag is a `signal`, ADR 0079 decision 6); React is a peer because
`signal` is exported from `@stackra/state/react`.

## What is here

| Symbol               | Use                                                                         |
| -------------------- | --------------------------------------------------------------------------- |
| `electLeader`        | `electLeader("query.queue")` joins the election and returns its participant |
| `withTabLock`        | `await withTabLock("identity.refresh", task)` runs one task at a time       |
| `ElectionMethod`     | `web_locks`, `broadcast_channel`, `memory`: how an election reaches others  |
| `LeaderElection`     | `name`, `method`, `isLeader` (read-only signal), `whenLeader()`, `resign()` |
| `ElectLeaderOptions` | `method` to force one, `heartbeat` (a `Duration`) for the fallback          |

## Electing a leader

```ts
import { electLeader } from "@stackra/coordinator";
import { useSignal } from "@stackra/state/react";

const election = electLeader("query.queue");
election.isLeader.subscribe((leads) => (leads ? queue.start() : queue.stop()));
window.addEventListener("pagehide", () => election.resign());

// in a component
const isLeader = useSignal(election.isLeader);
```

`await election.whenLeader()` resolves once the tab leads; it rejects if the tab resigns first. `resign()` leaves for
good and hands leadership on; join again with a new `electLeader` call.

## The methods

| Method              | Picked when                             | Guarantee                                                                 |
| ------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| `web_locks`         | `navigator.locks` exists                | exactly one leader; the browser frees the lock when the tab closes        |
| `broadcast_channel` | no Web Locks, `BroadcastChannel` exists | best effort: takeover after three missed heartbeats, or at once on resign |
| `memory`            | neither (React Native, some workers)    | one realm only: the first participant leads, the next after it resigns    |

With the BroadcastChannel fallback two tabs can both lead for up to one heartbeat, and a newcomer waits three beats
before it may lead. Work a leader does must tolerate a duplicate (the offline queue's idempotency keys do).

## Locks

`withTabLock(name, task)` is an election held for one task: it waits until this tab leads, runs the task, and resigns
whether the task resolves or throws. A lock and an election of the same name exclude each other. Server-side locks are
`@stackra/locking` (ADR 0103); the two share no code.
