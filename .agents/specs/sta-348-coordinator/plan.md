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

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                   |
| ------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/state/coordinator`; workspace imports: `@stackra/contracts`, `@stackra/state` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                    |
| Security                              | N/A    | no auth, tenant data or outbound call                                                                                                                  |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                           |
| Tenancy                               | N/A    | no tenant data                                                                                                                                         |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                 |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                       |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                              |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                      |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                        |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                     |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                |

- Boundaries: runtime imports `@stackra/contracts` and `@stackra/state` only; no app, service or `encore.dev`. `signal`
  is in `@stackra/state/react`, which `src/core` may not import; the two imports carry a reasoned disable until state
  exports `signal` from `.`.
- Versions: catalogs and `workspace:*` only.
- Naming: v3.1; files `<name>.<kind>.ts`; one declaration per file; "Precondition, never Guard": not used.
- Secrets: none.
- No parameter properties and no `#private` fields (apps typecheck the source under `erasableSyntaxOnly`).

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.` — Validates: FR-001
- **P-002**: `.` exports `electLeader`, `withTabLock`, `ElectionMethod`, `LeaderElection` and `ElectLeaderOptions` and nothing else — Validates: FR-002
- **P-003**: `electLeader` uses Web Locks when present, else BroadcastChannel, else memory, unless `options.method` names one, and `LeaderElection.method` reports the method in use — Validates: FR-003
- **P-004**: `LeaderElection.isLeader` is the read half of a `@stackra/state` signal, so `useSignal(election.isLeader)` reads it — Validates: FR-004
- **P-005**: with the BroadcastChannel method the heartbeat is `options.heartbeat` (default one second), another participant takes over after three missed beats or at once on a resignation, and the lower participant id wins a tie — Validates: FR-005
- **P-006**: every Web Lock name and BroadcastChannel name starts with `stackra.coordinator:` — Validates: FR-006
