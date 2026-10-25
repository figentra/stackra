# Plan: `@stackra/identity` wave 6

**Spec**: `.agents/specs/sta-348-identity/spec.md`

## Design

- Four entries through stand-in barrels (STA-339 replaces them): `.` from `src/core/` with `src/config/` (the
  configuration, enums, refusals, the session service, the drivers, the claims mapping), `./contracts` from
  `src/contracts/` (the `SessionStore` and `SignInBrowser` ports and `SessionUser`), `./react` from `src/react/`
  (`useSession` and its types), `./testing` from `src/testing/` (`fakeSession`, `SessionFake`, `fakeIdentity`).
- One port per flow: gen's wiring picks the `SessionStore` driver per target from `IdentityConfig.flow`. The state
  machine and the listeners live in `SessionService` alone.
- The BFF driver goes through `@stackra/transport` with `credentials: "include"` on the API origin of `ClientsConfig`.
- The PKCE driver discovers the provider from the issuer, builds the `S256` request with WebCrypto, takes the redirect
  from the platform's `SignInBrowser`, checks the callback and the ID token, and keeps the session in `Storage.secrets`.
  Renewals in flight are shared; `invalid_grant` drops the session.
- `sessionUserOf` reads the Stackra claims into `SessionUser`; its memberships are tenancy's `TenantMembership`, which
  `SessionService` hands to `TenantSwitcher` on every change, so the active scope follows the session.
- `SessionClientSessionDriver` fills `@stackra/clients`' `ClientSession` from the session and `ActiveScopeService`.
- `useSession` reads the service through `useSyncExternalStore` and starts it on mount; `fakeSession` is a real
  `SessionService` over a memory store with spied actions.

## Constitution Check

| Law                                   | Result | Note                                                                                                                        |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/security/identity`; imports only `tier:lib` packages; no app, service or `encore.dev`               |
| Secrets (ADR 0173)                    | PASS   | no secret in code or config; a public client id only; tokens leave a driver only through `accessToken()`                    |
| Security                              | PASS   | state, issuer, audience, expiry and nonce checked; `S256` only; stored and fetched sessions parsed; revoke drops the tokens |
| HTTP and events                       | PASS   | no endpoint or event of its own; the BFF routes are the identity service's                                                  |
| Tenancy                               | PASS   | no tenant identifier declared; memberships are tenancy's type; the one client header is `X-Scope-Path`                      |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) the tests; a separate reviewer      |
| Not built yet (ADR 0227)              | PASS   | no rejected or deferred technology; no login UI (ADR 0268 R3)                                                               |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                                   |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                                           |
| Deploy modes (ADR 0076)               | PASS   | one build in SaaS, on-prem and air-gapped                                                                                   |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                                          |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; ADR 0206, 0241, 0277 and 0327 stand, the open items are listed in the spec        |

- Boundaries: runtime imports of clients, config, container, contracts, errors, scope, storage, tenancy, transport and
  validation; dev-only `@stackra/testing`, the tooling presets and the React test libraries.
- Versions: catalogs and `workspace:*` only.
- Naming: drivers `<Name><Port>Driver`, the service `SessionService`, refusals end in `Error`; `AuthFlow` keeps the
  template's name, new names avoid the abbreviation (`SignInBrowser`).

## Properties

- **P-001**: `package.json` names `@stackra/identity` at `packages/security/identity` and `exports` lists only `.`, `./contracts`, `./react` and `./testing` — Validates: FR-001
- **P-002**: `IdentityConfig$.parse({})` equals the `IdentityOptions` initializers, every field rule refuses its bad values, and no field names a secret — Validates: FR-002
- **P-003**: for every BFF answer, `load` is the user for a session body, `null` for a 401 or `null` body, and a `TransportError` otherwise; no request carries `Authorization` — Validates: FR-003
- **P-004**: a session is kept only when the callback's state, and the ID token's issuer, audience, expiry and nonce, all match; a renewal answered `invalid_grant` leaves nothing kept; any other renewal failure leaves the session unchanged — Validates: FR-004
- **P-005**: for every claims object with a `usr_` id and an address, `sessionUserOf` gives a user whose memberships keep each `scp_` id, path and role list, the role being the first; without either it refuses `unauthenticated` — Validates: FR-005
- **P-006**: after any sequence of start, sign-in, sign-out and token reads, the switcher's memberships equal the state's user's, and a `SessionRevokedError` from the store leaves `revoked` with no user — Validates: FR-006
- **P-007**: the hook renders the service's current state after every change, `loading` on the server — Validates: FR-007
- **P-008**: `headers()` holds `Authorization` exactly when there is a token and `X-Scope-Path` exactly when a scope is active; `can` is true exactly for a held permission — Validates: FR-008
- **P-009**: `fakeSession({ status })` reports that status, its actions are spies, and two fakes never share state; `fakeIdentity` answers exactly the named principals — Validates: FR-009

## Deploy modes

| Mode       | Behaviour                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------- |
| SaaS       | the same build against ZITADEL Cloud                                                      |
| On-prem    | identical: the same build against a self-hosted ZITADEL, no SaaS-only code path           |
| Air-gapped | identical: the issuer is the deployment's own ZITADEL; nothing reaches an outside service |
