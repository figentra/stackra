# Feature Specification: a shared edge nonce store over `Cache.add`, and secret-store edge signing keys

**Feature Branch**: `figentra/sta-2803-edge-shared-nonce-store`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: leader (technical stop under the owner's delegation; change risk R3, so the security reviewer reads it too)

**Linear**: STA-2803

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: ADR 0437 decision 4 lists "a shared nonce store (`Cache.add`, an atomic set-if-absent)" as planned and says
it must land before any edge goes live (leader, 2026-11-09). Until it ships, `EdgeHeaderGuard` refuses a replayed
signed request only on the API instance that saw it first. The same ADR names a secret-store driver for the edge
signing keys, which does not exist yet. Pull request #1098 builds both.

## Impact

- **Apps touched**: apps/docs (ADR 0437's Enforcement list only)
- **Services touched**: none
- **Packages touched**: packages/runtime/cache (`Cache.add` on the port and its drivers), packages/runtime/app (two new edge drivers, `EdgeConfig.signingKeysSecret`, the server barrel, the manifest), packages/data/database (the cache-tables migration test only)
- **Public contract change**: additive: `Cache.add(key, value, ttl): Promise<boolean>` on the `Cache` port (`@stackra/cache/contracts`); `CacheEdgeNonceStoreDriver` and `SecretsEdgeSigningKeysDriver` exported from `@stackra/app/server`; driver names `cache` (`app.EdgeNonceStore`) and `secrets` (`app.EdgeSigningKeys`); config key `app.edge.signingKeysSecret`; both `stackra.manifest.json` driver lists. No existing member changes its signature or default.
- **Cross-service events**: none
- **Tenancy and data**: none (a claim stores the value `true` under `EdgeNonceStore:<request id>` in the shared namespace for the validity window; no tenant data, no new table: Postgres uses the existing unlogged cache tables)
- **Security and privacy**: replay protection of signed edge requests across API instances; signing keys read by name from the bound `SecretStore`; both drivers fail closed (a claim that cannot be made, or a store that throws, refuses the request)
- **Secrets**: `STACKRA_EDGE_SIGNING_KEYS` (existing, by name only; `signingKeysSecret` may name another SCREAMING_SNAKE secret); `CACHE_VALKEY_URL` (existing, for the `valkey` cache driver)
- **ADR needed**: no (implements ADR 0437 decision 4 and its Enforcement list, which this change updates)
- **New dependencies**: `@stackra/cache` (workspace) in `@stackra/app`; `testcontainers` (catalog, dev only) in `@stackra/cache`
- **Deploy modes**: same in all three (`valkey` and `postgres` run on-prem and air-gapped; no outbound call is added)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: apps/docs/src/docs/adr/0437-the-edge-worker-its-kv-copy-and-the-server-checks.mdx, packages/runtime/app/README.md, packages/runtime/app/AGENTS.md, packages/runtime/cache/README.md, packages/runtime/cache/AGENTS.md
- **Lane**: full
- **Change risk**: R3 (auth: the edge request guard; secrets: the signing keys)

## Discovery

- **Current behaviour**: `EdgeHeaderGuard` (order -100) verifies the signed edge headers with the keys from the bound
  `EdgeSigningKeys`, then claims the request id with the bound `EdgeNonceStore`. The only `EdgeNonceStore` driver is
  `memory`, which keeps ids in one process, so a request replayed to a second instance inside the window passes there.
  `EdgeSigningKeys` has `memory` and `env`; `env` reads `EdgeConfig.signingKeys`, resolved once at boot (SRC-001,
  SRC-002).
- **Topology**: the `Cache` port in `packages/runtime/cache/src/contracts/ports/cache.port.ts`; its drivers extend
  `StoredCacheDriver` over `storedCache` and a `CacheEntryStore` (`memoryEntryStore`, or `textEntryStore` over a
  driver's `CacheStore`). The edge ports live in `packages/runtime/app/src/contracts/ports/`, their drivers in
  `packages/runtime/app/src/server/drivers/`, the names in `EDGE_DRIVERS` and the config in `EDGE_CONFIG_SCHEMA` /
  `EdgeOptions` (SRC-001, SRC-003).
- **Dependencies**: a `Cache` driver whose store is shared by every instance (`valkey` or `postgres`) for the
  cross-instance guarantee; Testcontainers (Valkey) and a Postgres for the integration tests (SRC-003, SRC-006).
- **Ownership**: `@stackra/cache` and `@stackra/app` are runtime packages owned by the core maintainers; ADR 0437 by
  the leader (SRC-004).
- **Constraints already decided**: ADR 0437 decision 4 (two signing keys; a short-lived store of seen ids per region);
  ADR 0150 (the cache package); ADR 0160 (raw SQL is parameterised); ADR 0173 and ADR 0525 (secrets by name); ADR 0263
  (gen writes the wiring); ADR 0266 (`memory` first, one option one driver); ADR 0294 decision 26 (a package ships its
  own config schema) (SRC-004, SRC-005).

### Sources

- **SRC-001**: `packages/runtime/app/src/server/services/edge-header.guard.ts` and `packages/runtime/app/src/contracts/ports/edge-nonce-store.port.ts` on `origin/main`: the guard claims after verifying; the port's only driver is `memory` (FR-001 to FR-003)
- **SRC-002**: `packages/runtime/app/src/server/drivers/env-edge-signing-keys.driver.ts` and `packages/runtime/app/src/core/schemas/edge-options.schema.ts` on `origin/main`: `env` splits the boot-resolved `signingKeys` (FR-007 to FR-009)
- **SRC-003**: `packages/runtime/cache/src/contracts/ports/cache.port.ts`, `src/core/functions/stored-cache.function.ts`, `src/node/drivers/valkey-cache.driver.ts`, `src/node/drivers/postgres-cache.driver.ts`, `src/worker/drivers/workers-cache.driver.ts`, `src/core/drivers/storage-cache.driver.ts` on `origin/main`: no set-if-absent exists (FR-004 to FR-006)
- **SRC-004**: ADR 0437 decision 4 and its Enforcement list ("planned — a shared nonce store (`Cache.add` …)") in `apps/docs/src/docs/adr/` (FR-001 to FR-010)
- **SRC-005**: ADR 0150, ADR 0160, ADR 0173, ADR 0263, ADR 0266, ADR 0294, ADR 0525 in `apps/docs/src/docs/adr/` (FR-004 to FR-010)
- **SRC-006**: the diff of pull request #1098 (`git diff origin/main...figentra/sta-2803-edge-shared-nonce-store`) and its tests (FR-001 to FR-010)
- **SRC-007**: STA-2803 (this work) and STA-2804 (a reloading boot `SecretStore`, follow-up) (FR-009)

## Glossary

- **Claim**: `EdgeNonceStore.claim(nonce, ttlSeconds)`; true for the first claim of a request id inside its window.
- **Set-if-absent**: a write that stores only when nothing live is kept under the key, in one atomic step on the store.
- **Shared cache**: a `Cache` driver whose store every API instance of a region reads and writes (`valkey`, `postgres`).

## User Scenarios & Testing

### User Story 1 - A replay is refused on every instance (Priority: P1)

An operator runs two or more API instances behind the edge Worker. A signed request captured once and sent again to a
different instance inside the 60-second window is refused there, as it is on the first.

**Why this priority**: ADR 0437 forbids any edge going live before this holds.

**Independent Test**: two `EdgeHeaderGuard`s over one Postgres cache (`edge-nonce-shared.int.test.ts`): the second
refuses the request the first accepted.

**Acceptance Scenarios**:

1. **Given** `app.edge.nonces: cache` over a `postgres` or `valkey` cache, **When** instance B receives a request
   instance A accepted, **Then** B refuses it with `EdgeSignatureInvalidError`.

### User Story 2 - Signing keys read from the secret store (Priority: P2)

An operator selects `app.edge.keys: secrets`; the guard reads the keys by name from the bound `SecretStore` on every
check, so a store that reloads is followed without a restart.

**Why this priority**: a rotation without a cut-over is ADR 0437 decision 4; the reloading boot store is STA-2804.

**Independent Test**: `secrets-edge-signing-keys.driver.test.ts` and `edge-signing-keys-boot.test.ts`.

**Acceptance Scenarios**:

1. **Given** `app.edge.keys: secrets` and a `SecretStore` the caller reloads, **When** the store's value changes,
   **Then** the next check uses the new keys with no reboot.

### Edge Cases

- **EC-01**: `app.edge.nonces: cache` over the `storage` or `workers` cache driver: `Cache.add` rejects, so every
  signed request is refused (fail closed).
- **EC-02**: `app.edge.nonces: cache` over the `memory` cache driver: replays are refused per instance only, and the
  claims share the app cache's LRU bound (documented, not enforced).
- **EC-03**: the signing-keys secret is unset or blank: no key is active and every signed request is refused.
- **EC-04**: a `flush()` of the shared namespace, or a `forget` on the `EdgeNonceStore` key, drops live claims for the
  rest of their window (documented).

## Requirements

### Functional Requirements

- **FR-001**: THE `EdgeNonceStore` port SHALL have a `cache` driver (`CacheEdgeNonceStoreDriver`) that claims a request id by calling `Cache.add(CacheKey.of(EdgeNonceStore, nonce), true, Duration.seconds(ttlSeconds))` on the bound `Cache`. Sources: SRC-001, SRC-004
- **FR-002**: WHEN two instances that share a `valkey` or `postgres` cache claim the same request id inside its window THE `cache` driver SHALL answer true to exactly one of them. Sources: SRC-003, SRC-004
- **FR-003**: IF the bound `Cache` cannot add (its `add` rejects) THEN THE `EdgeHeaderGuard` SHALL refuse the request. Sources: SRC-001
- **FR-004**: THE `Cache` port SHALL declare `add<T>(key: CacheKey, value: T, ttl: Duration): Promise<boolean>`, whose default rejects with a `TypeError` naming the driver. Sources: SRC-003, SRC-005
- **FR-005**: WHEN `add` is called on the `memory`, `valkey` or `postgres` driver THE driver SHALL store the value for exactly `ttl` (no jitter, no stale window, no tags) only where no live entry is kept (an entry in its stale window counts as live), answer whether it stored, and answer false for a zero `ttl`. Sources: SRC-003
- **FR-006**: WHEN `add` is called on the `storage` or `workers` driver THE driver SHALL reject, since neither store has an atomic set-if-absent. Sources: SRC-003
- **FR-007**: THE `EdgeSigningKeys` port SHALL have a `secrets` driver (`SecretsEdgeSigningKeysDriver`) that reads the secret named by `EdgeConfig.signingKeysSecret` (default `STACKRA_EDGE_SIGNING_KEYS`) from the bound `SecretStore` on every `active()` call. Sources: SRC-002, SRC-005
- **FR-008**: THE `env` and `secrets` drivers SHALL parse the secret's text with one function (`edgeSigningKeysOf`): comma-separated, newest first, blanks dropped, an unset or blank secret answering no key. Sources: SRC-002
- **FR-009**: IF the bound `SecretStore` throws THEN THE `secrets` driver SHALL reject, so the check fails closed; IF `signingKeysSecret` is not SCREAMING_SNAKE THEN THE config schema SHALL refuse it. Sources: SRC-002, SRC-007
- **FR-010**: THE `memory` driver SHALL stay the default for both `app.edge.keys` and `app.edge.nonces`, and both `stackra.manifest.json` files SHALL list the new candidates. Sources: SRC-004, SRC-005

### Non-functional Requirements

- **NFR-001**: THE Valkey `add` SHALL be one `SET … PX … NX` command and the Postgres `add` one parameterised upsert (ADR 0160). Sources: SRC-003
- **NFR-002**: THE `cache` driver SHALL store only the value `true` under the request id, never request data. Sources: SRC-001

### Key Entities

- **Claim entry**: key `EdgeNonceStore:<request id>` in the namespace current when the guard runs, value `true`, lifetime the guard's validity window (120 s).

## Acceptance criteria

- **AC-001**: WHEN a request id is claimed through the `cache` nonce store on one instance THE `EdgeHeaderGuard` of another instance sharing the cache SHALL refuse the same request inside the window.
- **AC-002**: WHEN concurrent `add` calls for one key reach a `memory`, `valkey` or `postgres` cache THE cache SHALL answer true to exactly one.
- **AC-003**: IF the bound cache's `add` rejects THEN THE `EdgeHeaderGuard` SHALL refuse the signed request.
- **AC-004**: WHEN `add` is called on the `storage` or `workers` driver, or on a driver that keeps the port default, THE call SHALL reject.
- **AC-005**: THE `add` SHALL keep a value for exactly its `ttl`, and the Postgres `add` SHALL replace a dead row and never a live one.
- **AC-006**: WHEN `app.edge.keys` is `secrets` THE driver SHALL answer the keys the bound `SecretStore` holds at the time of the call, newest first, blanks dropped.
- **AC-007**: IF the signing-keys secret is unset or blank, or the store throws THEN THE `secrets` driver SHALL answer no key or reject, and the guard SHALL refuse the request.
- **AC-008**: THE `@stackra/app/server` barrel SHALL export `CacheEdgeNonceStoreDriver` and `SecretsEdgeSigningKeysDriver`, and the manifests SHALL list `cache` and `secrets` as candidates.

## Success Criteria

- **SC-001**: on real Postgres, two guards over one cache let exactly 1 of N concurrent deliveries of one signed request through — verified by: unit (integration, `edge-nonce-shared.int.test.ts`)
- **SC-002**: on real Valkey, exactly 1 of N concurrent `add` calls for one key answers true — verified by: unit (integration, `valkey-cache.driver.int.test.ts`)

## Out of scope

- A `bootApp` `SecretStore` that reloads, so a rotation needs no restart (STA-2804).
- Refusing or warning at boot when `app.edge.nonces: cache` sits over a non-shared `Cache` driver (review note 1).
- An unindexed `add` or a dedicated prefix for nonce claims (review note 2).

## Assumptions

- Every API instance of a region shares one `valkey` or `postgres` cache; the operator sets `app.edge.nonces: cache`
  before that region's edge goes live, as ADR 0437 requires.
- The validity window stays 60 seconds either side (claims kept 120 s).

## Amendments

None.

## Status history

- 2026-11-26 · — → Draft · spec author · written from pull request #1098's diff
- 2026-11-26 · Draft → Clarified · spec author · questions answered from the diff and ADR 0437
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Planned (plan.md) — Approved by Idris (CTO) 2026-11-26
- 2026-11-26 → Tasked (tasks.md)
- 2026-11-26 → Implementing (built on the branch, tasks ticked)
