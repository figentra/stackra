# AGENTS — @stackra/identity

Identity, provider-neutral over ZITADEL: the sign-in flows (BFF on the web, PKCE on devices), the client's session and
the claims mapping (ADR 0206, 0241, 0277). Member at `packages/security/identity` (`tier:lib`), in the programming
model v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts`, `./desktop`, `./native`, `./react`, `./testing`.

## Where code goes

| You are writing…                     | It goes in…                                     |
| ------------------------------------ | ----------------------------------------------- |
| The configuration (`IdentityConfig`) | `src/config/identity.config.ts`                 |
| Its schema and shipped `X$`          | `src/core/schemas/`, `src/core/constants/`      |
| A port and the types it names        | `src/contracts/{ports,types}/`                  |
| A session or resolver driver         | `src/core/drivers/<name>-<port>.driver.ts`      |
| The session service                  | `src/core/services/`                            |
| A claims or PKCE helper              | `src/core/functions/`                           |
| A refusal                            | `src/core/errors/`                              |
| An integration event                 | `src/core/events/`                              |
| React code                           | `src/react/session/`, `src/react/app-approval/` |
| React Native hooks                   | `src/native/app-approval/`                      |
| A test helper or fake                | `src/testing/`                                  |
| A test                               | `__tests__/<name>.<kind>.test.ts(x)` beside it  |

## Entries and barrels

- `src/{core,contracts,react,testing}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add
  every new public file to its barrel and to that entry's `index.test.ts`.
- The session-user schema and the PKCE helpers (`randomToken`, `codeChallengeOf`, `jwtClaimsOf`, `base64UrlOf`) stay
  internal.
- Platform drivers live in their own entries: `./native` (Expo, `expo-web-browser` and `expo-linking`) and `./desktop`
  (Electron main, `electron` and `node:http`), each an optional peer; never import them from `.`.

## This package

- No secret, ever: a browser has no client credential (the BFF holds it, by name), and a device is a public client.
  Never log or return a token; it leaves a driver only through `accessToken()`.
- No "tenant" identifier is declared here (ADR 0323, R-59): the memberships are `@stackra/tenancy`'s
  `TenantMembership`, and the claims speak of scope nodes. `SessionUser.memberships` names the list.
- A callback or token answer is untrusted: check the state, the issuer, the audience, the expiry and the nonce; parse
  every stored or fetched session through its schema.
- `invalid_grant` on renewal is a revoked session; any other renewal failure keeps the session (ADR 0206 d9).
  `SessionStatus.Revoked` is the signal `SessionOfflineSessionDriver` hands `@stackra/query`'s `OfflineLock`, which
  wipes the offline stores; this package never clears another package's storage area itself (ADR 0338 decision 4).
- The session's state lives in `SessionService` only; drivers keep credentials and never notify.
- `SessionService` is the only writer of `@stackra/iam`'s `PermissionSnapshotService`; iam never imports identity
  (identity depends on iam, not the reverse).
- Configuration, not code: which external sign-in providers a market offers and which KYC/KYB providers answer each
  check are market-pack data (`signInProvidersKey`, `verificationPackKey`); the provider ids, PIN rules, step-up window
  and key prefixes are `IdentityConfig` values. Never name a country, provider or number in code.
- A platform verification (Figentra checking a tenant, `VerificationUse.Platform`, the default) never runs through a
  tenant's own Connection: pin `ProviderResolver#candidates("verification", …)` to `managed`, and `verifyThrough`
  drops an `own` candidate again. Vendor verification Connections live in the OS integrations service (R3-8), never
  in this package; it keeps the port (capability map M2).
- A staff PIN is stored only as its salted PBKDF2 hash and compared in constant time; a key is shown once and only its
  hash is stored. Never log either.
- An API key's `lastUsedAt` is written by `ApiKeyVerifierService` only (through `ApiKeyStore.recordUse`), throttled
  by `apiKeyLastUsedSeconds`; a failed write never refuses a valid key.
- `IdpAdmin.listAuthMethods` answers RFC 8176 `amr` codes; which level each reaches is `assuranceByMethod`
  (configuration), never the driver.
- A login policy's providers and second factors are data (market pack and tenant settings) pushed through
  `IdpAdmin.setLoginPolicy`; the driver makes the provider match the list exactly and never picks a provider itself.
- An automation runs as its own principal from `AutomationPrincipals.mint` (ADR 0153), never as its publisher; the port
  mints and revokes, and grants are the workflow package's check.
- App approval: the requester learns `pending`, `approved` or `ended` only, and one refusal
  (`AppApprovalRejectedError`) covers every failed check, so nothing says whether an account exists or which check
  failed. The poll secret and the QR token are stored as SHA-256 hashes only. Identity records
  `sessions.app_approval.*` events on the written challenge and never calls push (notifications does). The number is
  never in an event or a log. A grant is data; the host's BFF opens or raises the session at the provider.
- A guardian acting for a minor, a manager override and a step-up grant nothing themselves: the IAM decision point still
  decides the action.
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
