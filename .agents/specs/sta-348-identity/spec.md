# Feature Specification: `@stackra/identity` wave 6, the sign-in flows, the session and the claims mapping

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348 (wave 9 revoke-and-wipe driver: STA-488)

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/identity` (security, wave 6, registry row "ZITADEL driver, session, BFF/PKCE"): the
provider-neutral client over ZITADEL (ADR 0206), the BFF cookie session on the web and the PKCE flow on devices, the
client's session with `useSession`, the session claims the tenant switcher and the scope resolver chain read, the
`ClientSession` binding `@stackra/clients` needs, and the test helpers the template imports.

## Impact

- **Apps touched**: none (the template's console and mobile apps consume it)
- **Services touched**: none (the template's notifications tests use `fakeIdentity`)
- **Packages touched**: `packages/security/identity` (new member)
- **Cross-service events**: none
- **Tenancy and data**: no tables; a device keeps its tokens in the `secrets` storage area; the memberships are the
  tenancy package's `TenantMembership`, filled from the session claims (the `scp_` id, the path and the roles)
- **Secrets**: none; a browser has no client credential and a device is a public client (ADR 0173: secrets are names)
- **ADR needed**: no (ADR 0206, 0241, 0277, 0327, 0338 d4)
- **New dependencies**: none new outside the workspace; wave 9 adds `@stackra/query` (the `OfflineSession` port)
  through `workspace:*`; workspace packages through `workspace:*`, `zod` through `catalog:`, the React test
  libraries and jsdom through `catalog:frontend` (tests only)
- **Deploy modes**: same in all
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/security/identity/README.md`, `packages/security/identity/AGENTS.md`; ADR 0206, 0241, 0277, 0327 and 0338 are cited and amended only by a note if a decision here changes
- **Lane**: lite
- **Change risk**: R3 (authentication: the callback, ID-token and renewal checks every signed-in device relies on)

## Clarifications

### Session 2026-10-25

The package follows ADR 0206, 0241, 0277, 0327 and the v3.1 registry row, with the programming model v3 and v3.1
(ADR 0294, 0305). The choices recorded when it was specified:

- ADR 0206 d8 and 0241 d2, d4: `SessionStore` is the port of a flow; `BffSessionStoreDriver` serves the web and the
  PWA (the cookie, no token in JavaScript), `PkceSessionStoreDriver` desktop and mobile (tokens in the `secrets`
  storage area, which a platform's storage driver keeps where the platform protects secrets, ADR 0277 d3)
- The one platform step of PKCE (open the hosted page, take the redirect) is the `SignInBrowser` port; its Expo and
  Electron drivers need dependencies outside the catalogs and come with their entries, not in this wave
- ADR 0206 d2: the claims are Stackra's own (`IDENTITY_CLAIMS`: user id, memberships, scope path, permissions), added
  by the provider (on ZITADEL, the identity service's action); `sessionUserOf` maps them
- ADR 0327 d7: the scope claim is `urn:stackra:scope_path`, which the transport hands to the claim step as
  `ScopeRequest.claim`
- ADR 0338 d4: `SessionStatus.Revoked` is the revocation signal; `invalid_grant` on renewal means revoked, any other
  renewal failure keeps the session (ADR 0206 d9)
- ADR 0338 d4, wave 9 (STA-488): identity hands the signal to `@stackra/query`'s `OfflineLock` through
  `SessionOfflineSessionDriver` (the query port `OfflineSession`), which wipes and locks; identity clears no storage
  area of another package. The lock's sign-out past the offline limit goes through `SessionService.signOut` and
  resolves even when the provider cannot be told
- R-59 and ADR 0323: no tenant identifier is declared here; `SessionUser.tenants` keeps the template's field name and
  holds `TenantMembership` values
- `IdentityConfig` has no env map; the device's `issuer` and `clientId` are public values set per environment by
  runway's `config.identity` layer
- An actions `TenancyCheck` driver needs the tenant lifecycle, which stays in tenancy (ADR 0327 note on 0210); it is
  not built here

## User Scenarios & Testing

### User Story 1 - Sign in on the web through the BFF (Priority: P1)

The console's web target reads the session from the BFF, sends a signed-out visitor to the BFF login and signs out
there; no token reaches JavaScript.

**Independent Test**: `src/core/drivers/__tests__/bff-session-store.driver.test.ts`.

**Acceptance Scenarios**:

1. **Given** a cookie session, **When** the session is read, **Then** the user comes back from `<api>/api/auth/session`.
2. **Given** no session, **When** it is read, **Then** the answer is signed out (401 or `null`).
3. **Given** a signed-out visitor on `/orders`, **When** they sign in, **Then** the browser leaves for the BFF login with
   `returnTo=/orders`.

### User Story 2 - Sign in on a device with PKCE (Priority: P1)

The mobile app opens the hosted sign-in in the system browser, exchanges the code, keeps the tokens and renews them.

**Independent Test**: `src/core/drivers/__tests__/pkce-session-store.driver.test.ts`.

**Acceptance Scenarios**:

1. **Given** a configured issuer and client, **When** the user signs in, **Then** an `S256` request goes out and the code
   is exchanged with its verifier.
2. **Given** a callback with another state or an ID token with another nonce, **When** it returns, **Then** the sign-in
   is refused and nothing is kept.
3. **Given** an expiring access token, **When** a call needs it, **Then** it is renewed once and the refresh token
   rotated.

### User Story 3 - Read the session in a screen (Priority: P1)

Pages and the generated navigation call `useSession()`; a profile page reads `SignedInSession["user"]`.

**Independent Test**: `src/core/services/__tests__/session.service.test.ts`, `src/react/session/__tests__/use-session.test.tsx`.

### User Story 4 - Lose a device (Priority: P2)

A device whose session is revoked from "Sessions" learns it on its next renewal, drops its tokens and reports
`revoked`, so the offline stores wipe.

Through `SessionOfflineSessionDriver`, `@stackra/query`'s `OfflineLock` wipes the device's queue, replicas, tokens and
payload key on `revoked`, and a fresh sign-in unlocks it.

**Independent Test**: `src/core/services/__tests__/session.service.test.ts`, `src/core/drivers/__tests__/pkce-session-store.driver.test.ts`, `src/core/drivers/__tests__/session-offline-session.driver.test.ts`.

### User Story 5 - Call services with the session (Priority: P1)

The generated clients send the bearer token and the active scope's path, and hide a button the user may not use.

**Independent Test**: `src/core/drivers/__tests__/session-client-session.driver.test.ts`.

### User Story 6 - Test with a fake session and identity (Priority: P1)

The template's tests call `fakeSession({ status, tenants })` and `fakeIdentity({ [id]: { email, locale } })`.

**Independent Test**: `src/testing/functions/__tests__/fake-session.function.test.ts`, `src/testing/functions/__tests__/fake-identity.function.test.ts`.

### Edge Cases

- The user closes the hosted page or declines consent: `SignInCancelledError`, the state returns to where it was.
- The provider is unreachable during renewal: the session stays and the API judges the token.
- No refresh token and an expiring access token: revoked.
- A discovery document naming another issuer: refused.
- A stored session that no longer parses: signed out.
- A failure to read the session at boot: signed out, reported once.
- A refresh that repeats the same status tells no offline listener; a sign-out the provider cannot hear still ends the
  session on the device.

## Requirements

- **FR-001**: The package SHALL be `@stackra/identity` at `packages/security/identity`, `tier:lib`, entries `.`,
  `./contracts`, `./react` and `./testing` only.
- **FR-002**: `IdentityConfig` (key `identity`) and `IdentityConfig$` SHALL carry the flow per target, the device's
  issuer and client id, the scopes with `openid`, the BFF mount, the redirect path, the route after sign-out, the idle
  rule and the refresh switches, with defaults equal in both and no secret.
- **FR-003**: `BffSessionStoreDriver` SHALL read the session from `<api><bff>/session` with the cookie, treat a 401 or
  `null` as signed out, leave for `<bff>/login?returnTo=` and post `<bff>/logout`, and never send a token.
- **FR-004**: `PkceSessionStoreDriver` SHALL sign in with an `S256` request through `SignInBrowser`, refuse a wrong
  state, issuer, audience, expiry or nonce, keep the tokens and the user in the `secrets` area, renew before expiry with
  the refresh token rotated, turn `invalid_grant` into `SessionRevokedError` with the tokens dropped, keep the session
  on any other renewal failure, and revoke the refresh token on sign-out.
- **FR-005**: `sessionUserOf` SHALL map the `IDENTITY_CLAIMS` and the standard claims to a `SessionUser` whose
  memberships are `TenantMembership` values, and refuse a token without the user id or the address.
- **FR-006**: `SessionService` SHALL start once, hand every state's memberships to `TenantSwitcher`, be loading during
  sign-in and restore the state on a cancellation, end signed out on sign-out, become `revoked` on
  `SessionRevokedError`, sign out after `idleMinutes` without input, and read the session again on a visible window.
- **FR-007**: `useSession` SHALL return the session value, start the service on mount, stay `loading` in a server
  render, and report a read failure to a bound `ErrorReporter`.
- **FR-008**: `SessionClientSessionDriver` SHALL implement `ClientSession` with the bearer token and `X-Scope-Path`
  when present, and `can` from the user's permissions.
- **FR-009**: `fakeSession` SHALL return a session in the asked status, typed `SignedInSession` when signed in, with
  spied `signIn` and `signOut`, bindable as `SessionService`; `fakeIdentity` SHALL return an `IdentityResolver` over the
  named principals.
- **FR-010**: `SessionOfflineSessionDriver` SHALL implement `@stackra/query`'s `OfflineSession`: `isRevoked` and
  `isSignedIn` read `SessionService`'s status and tell their listeners only when their value changes, and `end` signs
  out and resolves even when the provider cannot be told.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package and the validator reports nothing for it.

## Open items (for the owner, not blocking)

- The template's gen wiring names `SecureStoreSessionStoreDriver` (`@stackra/identity/native`) and
  `PkceSessionStoreDriver` (`@stackra/identity/electron`); here one `PkceSessionStoreDriver` in `.` serves both, with
  the tokens in the `secrets` storage area and the browser step behind `SignInBrowser`. The Expo and Electron
  `SignInBrowser` drivers need `expo-web-browser` (not in the catalog) and the platform's Electron bridge (STA-344).
- The template's mobile config reads the issuer and client id from its `EnvConfig`; here they are `IdentityConfig`
  fields set by runway's `config.identity` layer.
- `refreshOnForeground` is declared (the template sets it); its reader is a device entry's app-state hook.
- The BFF's server side (the confidential client, the cookie, `/login`, `/callback`, `/session`, `/logout`) and a
  ZITADEL-backed `IdentityResolver` are the identity service's (ADR 0241 d5); the template binds `IdentityResolver` as
  a platform binding.
- An actions `TenancyCheck` driver belongs to `@stackra/tenancy`, where the tenant lifecycle stays (ADR 0327 note on
  0210 d2), over a port the identity service implements.
- The console's BFF session query (`identity.session.current`) lists memberships as `{ tenantId, name, role }`; the
  session now carries `path` and `roles` too, as tenancy needs.

## Status history

- 2026-10-25 · — → Implementing · Claude (package-builder) · spec for a package written in owner mode (develop now, test later)
