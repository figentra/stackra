# Plan: `@stackra/locking` wave 5

**Spec**: `.agents/specs/sta-348-locking/spec.md`

## Design

- Three entries through stand-in barrels (STA-339 replaces them): `./contracts` from `src/contracts/` (the leaf: the
  `LockDriver` port and the `LockLease` type), `.` from `src/core/` with `src/config/`, `./node` from `src/node/` (the
  Postgres driver and the token-sequence migration).
- `Locks` is a platform service over `LockDriver` and `Clock`. `with` and `tryWith` normalise the keys (sorted, each
  once), ask the driver for a place to hold them (`within`), take a lease (`with` polls `tryAcquire` with backoff from
  10 ms to 160 ms until the TTL has passed, then refuses `LockUnavailableError`), renew it every third of the TTL while
  the work runs and release it in `finally`.
- `MemoryLockDriver` keeps each key's token and expiry in a map, takes every key or none, counts tokens and reads time
  from the `Clock`.
- `PostgresLockDriver` runs `pg_try_advisory_xact_lock(hashtextextended(key, 0))` per key in the running transaction
  (opening one when none runs), stops at the first busy key, and draws the token with `nextval('locking.lock_tokens')`.
  Renewal and release have nothing to do: the locks end with the transaction. `CreateLockTokensMigration` creates the
  sequence in the package's schema.
- `LockingConfig extends Config({ schema: LockingOptions })`, with `LockingConfig$` and the `DriverRegistry` entry
  beside it as `@stackra/search` has them.

## Constitution Check

| Law                                   | Result | Note                                                                                                        |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/runtime/locking`; imports only `tier:lib` packages; no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged; the driver uses the service's own connection                           |
| Security                              | PASS   | every key is a bound parameter; the refusal carries no key, so no internal name reaches a caller            |
| HTTP and events                       | N/A    | no endpoint or event; the busy refusal is an `Unavailable` refusal (503, retryable)                         |
| Tenancy                               | PASS   | no table and no tenant words; a key names its scope itself (spec open item)                                 |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) runs the tests      |
| Not built yet (ADR 0227)              | PASS   | Postgres advisory locks and memory only; no Valkey, no external lock service                                |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                   |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                           |
| Deploy modes (ADR 0076)               | PASS   | one build in SaaS, on-prem and air-gapped                                                                   |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                          |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; ADR 0103 and 0149 stand, the gaps are listed in the spec          |

- Boundaries: runtime imports of config, container, contracts, database, errors and validation; dev-only
  `@stackra/testing` and the tooling presets.
- Versions: catalogs and `workspace:*` only.
- Naming: drivers `<Name>Driver`, the refusal ends in `Error`, the migration `CreateLockTokensMigration`, no `define`
  prefix; `Locks` keeps the template's platform name (as `Search` and `GraphQuery` do).

## Properties

- **P-001**: `package.json` names `@stackra/locking` at `packages/runtime/locking` and `exports` lists only `.`, `./contracts` and `./node` — Validates: FR-001
- **P-002**: each entry's `index.test.ts` lists exactly its values, with `Locks` in `.`, `LockDriver` in `./contracts` and `PostgresLockDriver` in `./node` — Validates: FR-002
- **P-003**: `buildConfig(LockingConfig)` equals `LockingConfig$.parse({})` with driver `postgres`, `memory` builds, and another name refuses — Validates: FR-003
- **P-004**: for every key list, the driver receives it sorted with no repeat; a held key makes `with` wait and refuse after the TTL, and a lease outlives its TTL while the work runs — Validates: FR-004
- **P-005**: for every sequence of leases on one key, each token is larger than the one before, and each lease carries the owner of the `Locks` that took it — Validates: FR-005
- **P-006**: for every key list, the driver's SQL holds no key text, each statement has as many placeholders as parameters, and no transaction opens when one runs — Validates: FR-006
- **P-007**: for every interleaving of acquire, renew, release and clock moves, no two live leases share a key and a stale lease can neither renew nor release — Validates: FR-007
- **P-008**: `grep -ri tenant packages/runtime/locking/src` and `grep -r WithLock packages/runtime/locking/src` find nothing — Validates: FR-008

## Deploy modes

| Mode       | Behaviour                                                                      |
| ---------- | ------------------------------------------------------------------------------ |
| SaaS       | the same build; locks live in each service's own Postgres                      |
| On-prem    | identical: the same build, no SaaS-only code path                              |
| Air-gapped | identical: needs no network; Postgres holds the locks in the deployment itself |
