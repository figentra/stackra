# Plan: `@stackra/storage` wave 2

**Spec**: `.agents/specs/sta-348-storage/spec.md`

## Design

- `./contracts`: `Storage extends Port` with six abstract area properties named by the `StorageArea` codes, plus
  `store(type)`, `hydrate()`, `flush()`. The leaf imports no other entry, so it names areas as properties instead of
  importing the enum; a type test pins `StorageArea` to `keyof Storage`.
- `createStorageArea(backend?)` is the one area implementation: a `Map` of envelope text (`{"v":...,"e"?:...}`),
  synchronous reads and writes, expiry checked on read with `Date.now()`, `read`/`write` through `validate` from
  `@stackra/validation` and the key from `registerStorageKeys`. A synchronous backend loads at once, an asynchronous one
  on `hydrate()`; writes queue on one promise chain and a failure is kept for the next `flush()`.
- `AreaStorageDriver` (internal, abstract) builds the six areas from a backend map and routes `store(type)`;
  `MemoryStorageDriver` passes none; `WebStorageDriver` (`./browser`) passes prefixed `localStorage`/`sessionStorage`
  backends for `prefs`, `cache`, `session`.
- `usePrefs()` resolves `Storage` from `useContainer()`; `fakeStorage()` returns a new `MemoryStorageDriver`.
- Wave 9 (STA-488, ADR 0338 d2): `PayloadSeal` (port) with two drivers over `Storage`. Both read the key from
  `secrets` under `PAYLOAD_KEY` on every call, so a wipe of that area takes effect at once. `web_crypto` imports the
  raw 256-bit key (cached while the stored value is the same) and writes `v1.<nonce>.<ciphertext>` in base64;
  `memory` writes `m1.<key id>.<text>`. `@stackra/query`'s persister seals the `outbox` and `cache` payloads with it.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                                         |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/data/storage`; workspace imports: `@stackra/container`, `@stackra/contracts`, `@stackra/validation` (packages only); no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                                          |
| Security                              | N/A    | no auth, tenant data or outbound call                                                                                                                                        |
| HTTP and events                       | N/A    | no action, endpoint or event                                                                                                                                                 |
| Tenancy                               | N/A    | no tenant data                                                                                                                                                               |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                                       |
| Not built yet (ADR 0227)              | PASS   | no ORM on a client; client storage is `@stackra/storage` (ADR 0256)                                                                                                          |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                                    |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                                            |
| Deploy modes (ADR 0076)               | PASS   | a build-time library, identical in SaaS, on-prem and air-gapped                                                                                                              |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                                           |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand and no new ADR is needed                                                                                      |

- Boundaries: runtime imports `@stackra/contracts`, `@stackra/container`, `@stackra/validation` only; React is an
  optional peer; `./contracts` is a leaf; `./browser`, `./react`, `./testing` import `.`/`./contracts` through aliases.
- Versions: catalogs and `workspace:*` only. No ORM (ADR 0014, 0256 d6).
- Naming: v3.1; files `<name>.<kind>.ts`; enum codes snake_case; no parameter properties, no `#private` fields.

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |

## Correctness properties

- **P-001**: `package.json` `exports` lists exactly `.`, `./contracts`, `./browser`, `./react` and `./testing` — Validates: FR-001
- **P-002**: `.` exports `OfflineStore`, `StorageArea`, `MemoryStorageDriver`, `registerStorageKeys` and the type `StorageKey` — Validates: FR-002
- **P-003**: `./contracts` exports `Storage` and `.` does not, and `src/contracts/` imports no other entry — Validates: FR-003
- **P-004**: `./react` exports `usePrefs`, `./testing` exports `fakeStorage`, and `./browser` exports `WebStorageDriver` — Validates: FR-004
- **P-005**: a stored value is JSON, and a shape class is checked by its registered schema from `@stackra/validation`, never by a schema compiled at runtime — Validates: FR-005
- **P-006**: `registerStorageKeys` registers the keys gen derives, and no driver builds a key of its own — Validates: FR-006
- **P-007**: `package.json` lists no ORM and no third-party runtime `dependencies` entry — Validates: FR-007
- **P-008**: for any text, `open(seal(text))` equals the text while the key in `secrets` is unchanged, and is `undefined` once `secrets` is cleared or the sealed text is altered; `web_crypto`'s sealed text never contains the plain text and two seals of one text differ — Validates: FR-008
