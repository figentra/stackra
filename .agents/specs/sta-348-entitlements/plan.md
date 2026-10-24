# Plan: `@stackra/entitlements` wave 4

**Spec**: `.agents/specs/sta-348-entitlements/spec.md`

## Design

- Two entries, `.` from `src/core/` and `./testing` from `src/testing/`, through stand-in barrels (STA-339 replaces
  them). No `src/contracts/` folder: it would become a `./contracts` entry the registry row does not give, so the ports
  sit in `src/core/ports/`, as in `@stackra/contracts`.
- Groups: `bases/` (`Entitlement`), `enums/` (`EntitlementKind`), `errors/` (`LimitReachedError`), `ports/`
  (`EntitlementSource`, `EntitlementUsage`), `drivers/` (`PlanEntitlementCheckDriver`), `functions/`
  (`registerEntitlements`, `entitlementKey`), `constants/` (the internal registry), `types/`. One declaration per file.
- `Entitlement` is `createKind("entitlement", ...)` cast to a called-only factory; its reader checks the kind and that
  `counts` is a thunk exactly for a limit.
- The pipeline already calls `EntitlementCheck.check(call)` after the preconditions. `PlanEntitlementCheckDriver extends
Driver(EntitlementCheck)`, takes `EntitlementSource` and `EntitlementUsage` by constructor type, walks the registry
  rows that gate `call.type`, and refuses `EntitlementRequiredError` (from `@stackra/errors`) or `LimitReachedError`.
- `registerEntitlements` mirrors the manifest's `entitlements[]` rows (`key`, class, `gates`) and checks them like
  `registerActions` does.
- A grant is keyed by the entitlement class and the scope's public id; a keyed source reads the locked key through
  `entitlementKey`. The scope is read from the call descriptor in one marked place until contracts ships `ScopeRef`.
- `fakeEntitlements` builds an `EntitlementSource` instance over a map (the `FlagsFake` pattern), so a container
  override accepts it.

## Constitution Check

| Law                                   | Result | Note                                                                                                                                                        |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/security/entitlements`; imports only `@stackra/actions/contracts`, container, contracts and errors; no app, service or `encore.dev` |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged                                                                                                                         |
| Security                              | PASS   | refuses closed: a wrong-shape grant throws, an unreachable source fails the call; refusal details carry only the caller's own plan                          |
| HTTP and events                       | PASS   | plugs into the fixed pipeline step (ADR 0138); the refusal maps to HTTP 402 through its kind                                                                |
| Tenancy                               | PASS   | no tenant vocabulary (R-59); the scope is a public id until contracts ships `ScopeRef`                                                                      |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer                                      |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology is introduced                                                                                                            |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                                                   |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                                                           |
| Deploy modes (ADR 0076)               | PASS   | one build in SaaS, on-prem and air-gapped; only the bound `EntitlementSource` driver differs                                                                |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                                                          |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; ADR 0215 needs a note for `limit_reached` (open item)                                                             |

- Boundaries: runtime imports of `@stackra/actions` (`./contracts` only in source), `@stackra/container`,
  `@stackra/contracts` and `@stackra/errors`; dev-only `@stackra/testing` and the tooling presets.
- Versions: catalogs and `workspace:*` only.
- Naming: kind base `PascalCase(kind)`, no `define` prefix (0305 rule 3); the error ends in `Error`.

## Properties

- **P-001**: `package.json` names `@stackra/entitlements` at `packages/security/entitlements` and `exports` lists only `.` and `./testing` — Validates: FR-001
- **P-002**: `.` exports `Entitlement`, `EntitlementKind`, `EntitlementSource` and `LimitReachedError`, and `./testing` exports `fakeEntitlements`, each with the shape the template uses — Validates: FR-002
- **P-003**: for every kind `k` and thunk `t`, `Entitlement({ kind: k, counts: t })` succeeds exactly when `k` is `limit`, and `Entitlement({ kind: k })` exactly when `k` is not — Validates: FR-003
- **P-004**: `EntitlementSource` and `EntitlementUsage` are abstract classes that extend `Port`, and a driver of each is an instance of it — Validates: FR-004
- **P-005**: for every limit grant `n` and count `c`, the driver refuses `limit_reached` exactly when `c >= n`, and never counts when `n` is `Number.POSITIVE_INFINITY`; an ungranted right refuses `entitlement_required` — Validates: FR-005
- **P-006**: `LimitReachedError.envelope({ entitlement, limit })` has code `limit_reached`, category `entitlement_required`, `retryable: false` and exactly those details — Validates: FR-006
- **P-007**: `registerEntitlements` stores nothing and throws for a row with a non-entitlement class, an empty key or a gate that is not an action or a query — Validates: FR-007
- **P-008**: `fakeEntitlements(grants).grant(e, s)` equals the listed grant of `e` for every scope `s`, and `undefined` for an unlisted `e` — Validates: FR-008

## Deploy modes

| Mode       | Behaviour                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------- |
| SaaS       | the same build; the plan service binds the `EntitlementSource` driver over its snapshot   |
| On-prem    | the same build; the runtime binds a driver over the licence `@stackra/licensing` verified |
| Air-gapped | as on-prem: the signed licence file needs no network                                      |
