# Plan: `@stackra/coordinator` wave 3

**Spec**: `.agents/specs/sta-348-coordinator/spec.md`

## Design

- `electLeader(name, options)` (`src/core/functions/elect-leader.function.ts`) makes a `signal(false)` from
  `@stackra/state`, picks the method (`detectElectionMethod` unless `options.method`), starts it, and returns a frozen
  `LeaderElection`: `isLeader` is `{ get, subscribe }` of the signal, `whenLeader` subscribes until `true` and is rejected
  by `resign`, and `resign` (idempotent) calls the method's leave function, then sets the flag to `false`.
- A method is a plain function `(name, flag, heartbeatMs?) => leave` over the internal `LeaderFlag` type (`get`, `set`):
  - `electByWebLocks`: `navigator.locks.request(prefix + name, { signal }, () => new Promise(...))` holds the lock while
    leading; leave resolves the held promise or aborts the queued request (its AbortError is swallowed).
  - `electByBroadcastChannel`: a random id; the leader posts `heartbeat` every beat; a follower records the leader and the
    time; with no heartbeat for three beats it takes over; a `resign` from the recorded leader triggers takeover at once;
    a leader hearing a lower id steps down. Leave clears the interval, posts `resign` when leading, closes the channel.
  - `electInMemory`: `MEMORY_ELECTIONS` (name to flags, join order); the head leads; leave removes and promotes.
- `withTabLock(name, task, options)`: `electLeader`, `await whenLeader()`, `await task()`, `resign()` in `finally`.
- `ElectionMethod` is an `Enum.of` of `web_locks`, `broadcast_channel`, `memory`.

## Constitution check

- Boundaries: runtime imports `@stackra/contracts` and `@stackra/state` only; no app, service or `encore.dev`. `signal`
  is in `@stackra/state/react`, which `src/core` may not import; the two imports carry a reasoned disable until state
  exports `signal` from `.`.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; one declaration per file; "Precondition, never Guard": not used.
- Secrets: none.
- No parameter properties and no `#private` fields (apps typecheck the source under `erasableSyntaxOnly`).
