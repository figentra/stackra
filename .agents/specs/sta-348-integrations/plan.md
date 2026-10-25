# Plan: `@stackra/integrations` wave 4

**Spec**: `.agents/specs/sta-348-integrations/spec.md`

## Design

- Two entries: `.` from `src/core/` and `./testing` from `src/testing/`, through stand-in barrels (STA-339 replaces
  them).
- Groups: `bases/` (`Integration`, `Connection`), `enums/`, `errors/`, `ports/` (`ConnectionStore`,
  `ConnectionContext`, `ConnectionHost`), `drivers/` (`local`, `hosted`), `services/` (`IntegrationRuntime`),
  `functions/`, `values/` (`ConnectedAccount`), `types/`, `constants/` (the internal registries). One declaration per
  file.
- `Integration` is `createKind("integration", ...)` with a reader that checks the options; its base takes the
  `IntegrationRuntime` through `super()` and makes `api` on first use, kept in a `WeakMap` beside the instance.
- `Connection` is a bare kind base with the Integration as a type-only partner; `registerConnections` (emitted by gen)
  carries the partner and the key at runtime. A store loads a connection with `hydrateConnection`: plain fields set,
  secret fields non-enumerable, `id` and `api` beside the instance.
- The managed client is a function over the Integration's options: placeholders (connection, then Integration secret,
  then Integration field), the auth type, the `RateLimitStore` buckets of `@stackra/actions`, retries with backoff and
  `Retry-After`, and refusals. `IntegrationRuntime` makes clients and keeps OAuth tokens per credential, renewed
  single-flight.
- Lookup walks the declared levels: the user, then the call's scope node and each node above it by path, nearest
  first. Both drivers share the walk, the owner, the connect preparation (`check()`, `subscribe()`) and the replacement.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                 |
| ------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/communication/integrations`; imports only lower `@stackra/*` packages through their entries; no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | PASS   | secrets are names; values are read blind at call time or held by the store, never logged, echoed or put in an error                                  |
| Security                              | PASS   | calls stay on the declared base URL; only machine codes from a provider enter a refusal; refresh tokens stay in the store host in hosted mode        |
| HTTP and events                       | PASS   | refusals carry codes derived from class names (ADR 0140); webhook verification stays with the Integration (ADR 0308 rule 15)                         |
| Tenancy                               | PASS   | no tenant vocabulary (R-59); a connection is owned by a user or a `ScopeRef` (ADR 0327)                                                              |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                               |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced; Web Crypto and `fetch` only                                                                        |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                            |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                    |
| Deploy modes (ADR 0076)               | PASS   | the same library in SaaS, on-prem and air-gapped; outbound calls only to the declared providers                                                      |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                   |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; the cited ADRs stand, the open items are listed in the spec                                                |

- Boundaries: runtime edges to actions, config, container, contracts and errors; dev-only `@stackra/testing` and the
  tooling presets.
- Versions: catalogs and `workspace:*` only.
- Naming: kind bases `Integration` and `Connection`, no `define` prefix (0305 rule 3); refusals end in `Error`.

## Properties

- **P-001**: `package.json` names `@stackra/integrations` at `packages/communication/integrations`, `exports` lists only `.` and `./testing`, and every runtime dependency is `workspace:*` — Validates: FR-001
- **P-002**: `.` exports every template symbol of the row and `./testing` exports `fakeIntegrationApi` and `makeConnection` — Validates: FR-002
- **P-003**: For every declared integration, `kindOf(X)` is `{ kind: "integration", options }` with `multiple` defaulted, a malformed option throws on declaration, and `new X(runtime).api` calls `runtime.client` once — Validates: FR-003
- **P-004**: For every loaded connection, `id` and `api` are the store's, its secret fields are not enumerable, and an unloaded instance throws on `id` — Validates: FR-004
- **P-005**: For every call, the credential sent is the connection's field when set, else the Integration's; a non-idempotent call without a key is sent once; a 4xx gives `ProviderRefusedError` and spent retries give `ProviderUnavailableError`, neither containing the credential — Validates: FR-005
- **P-006**: For every owner and level order, `find` returns the first reachable tier's single connection or null, throws `ConnectionAmbiguousError` on a tier of several, and a refused `check()` leaves the store unchanged — Validates: FR-006
- **P-007**: For any number of concurrent calls on one expired credential, the token endpoint is called once — Validates: FR-007
- **P-008**: A fake answers only its declared routes, with the path's parameters, and the testing module's store reaches a connection by id and by `find` — Validates: FR-008

## Deploy modes

| Mode       | Behaviour                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------ |
| SaaS       | a library in the consumer's service; the `hosted` driver talks to the integrations service       |
| On-prem    | identical: the same build, no SaaS-only code path                                                |
| Air-gapped | identical: calls only the providers an Integration declares, so an offline install declares none |
