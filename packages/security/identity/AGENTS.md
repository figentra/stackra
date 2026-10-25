# AGENTS — @stackra/identity

Identity, provider-neutral over ZITADEL: the sign-in flows (BFF on the web, PKCE on devices), the client's session and
the claims mapping (ADR 0206, 0241, 0277). Member at `packages/security/identity` (`tier:lib`), in the programming
model v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts`, `./react`, `./testing`.

## Where code goes

| You are writing…                     | It goes in…                                    |
| ------------------------------------ | ---------------------------------------------- |
| The configuration (`IdentityConfig`) | `src/config/identity.config.ts`                |
| Its schema and shipped `X$`          | `src/core/schemas/`, `src/core/constants/`     |
| A port and the types it names        | `src/contracts/{ports,types}/`                 |
| A session or resolver driver         | `src/core/drivers/<name>-<port>.driver.ts`     |
| The session service                  | `src/core/services/`                           |
| A claims or PKCE helper              | `src/core/functions/`                          |
| A refusal                            | `src/core/errors/`                             |
| React code                           | `src/react/session/`                           |
| A test helper or fake                | `src/testing/`                                 |
| A test                               | `__tests__/<name>.<kind>.test.ts(x)` beside it |

## Entries and barrels

- `src/{core,contracts,react,testing}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add
  every new public file to its barrel and to that entry's `index.test.ts`.
- The session-user schema and the PKCE helpers (`randomToken`, `codeChallengeOf`, `jwtClaimsOf`, `base64UrlOf`) stay
  internal.
- A platform driver (an Expo or Electron `SignInBrowser`, a foreground hook reading `refreshOnForeground`) needs a new
  `./native` or `./electron` entry and its dependency in a catalog; neither ships yet.

## This package

- No secret, ever: a browser has no client credential (the BFF holds it, by name), and a device is a public client.
  Never log or return a token; it leaves a driver only through `accessToken()`.
- No "tenant" identifier is declared here (ADR 0323, R-59): the memberships are `@stackra/tenancy`'s
  `TenantMembership`, and the claims speak of scope nodes. `SessionUser.tenants` keeps the template's field name.
- A callback or token answer is untrusted: check the state, the issuer, the audience, the expiry and the nonce; parse
  every stored or fetched session through its schema.
- `invalid_grant` on renewal is a revoked session; any other renewal failure keeps the session (ADR 0206 d9).
  `SessionStatus.Revoked` is the signal `SessionOfflineSessionDriver` hands `@stackra/query`'s `OfflineLock`, which
  wipes the offline stores; this package never clears another package's storage area itself (ADR 0338 decision 4).
- The session's state lives in `SessionService` only; drivers keep credentials and never notify.
- `SessionService` is the only writer of `@stackra/iam`'s `PermissionSnapshotService`; iam never imports identity
  (identity depends on iam, not the reverse).
- No parameter properties and no `#private` fields: apps typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII and secrets

| Data              | Where                                  | Handling                                                                 |
| ----------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| Address, name     | `SessionUser.email`, `.displayName`    | shown to the user it belongs to; never logged or sent elsewhere          |
| Picture URL       | `SessionUser.avatarUrl`                | shown only                                                               |
| Tokens            | the `secrets` storage area (PKCE only) | kept where the platform protects secrets; dropped on sign-out and revoke |
| Principal address | `MemoryIdentityResolverDriver`         | resolved at the moment of use, never stored by a caller (ADR 0134)       |
