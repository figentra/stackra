# AGENTS — @stackra/identity

Identity, provider-neutral over ZITADEL: the sign-in flows (BFF on the web, PKCE on devices), the client's session and
the claims mapping (ADR 0206, 0241, 0277). Member at `packages/security/identity` (`tier:lib`), in the programming
model v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts`, `./desktop`, `./native`, `./node`, `./react`,
`./testing`.

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
| A server action and its schemas      | `src/node/{actions,schemas,access}/`            |
| A listener of another package        | `src/node/listeners/`                           |
| React code                           | `src/react/session/`, `src/react/app-approval/` |
| React Native hooks                   | `src/native/app-approval/`                      |
| A test helper or fake                | `src/testing/`                                  |
| A test                               | `__tests__/<name>.<kind>.test.ts(x)` beside it  |

## Entries and barrels

- `src/{core,contracts,node,react,testing}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add
  every new public file to its barrel and to that entry's `index.test.ts`.
- The session-user schema and the PKCE helpers (`randomToken`, `codeChallengeOf`, `jwtClaimsOf`, `base64UrlOf`) stay
  internal.
- Platform drivers live in their own entries: `./native` (Expo, `expo-web-browser`, `expo-linking` and
  `react-native-passkey`) and `./desktop`
  (Electron main, `electron` and `node:http`), each an optional peer; never import them from `.`.

## This package

- `Passkeys` is the device step only: options in, credential JSON out. Never make or check a WebAuthn challenge here;
  the server side (`./node`'s passkey actions over `IdpAdmin`) asks the provider and verifies. Library errors become
  `PasskeyRefusal` values, never throws. A passkey action finds the caller's provider user by the actor's `usr_` id
  (`IdpAdmin.findUserId`), never by a body field.
- Sign in with Apple (STA-1578): the web and the hosted flow go through ZITADEL's Apple provider
  (`externalSignIn(SocialProvider.Apple, …)`; `signInProvidersOf` offers a configured Apple in every market).
  `AppleSignIn` is the native device step only, like `Passkeys`: nonce in, Apple's token out, refusals as values.
  `expo-apple-authentication` is an optional peer (`catalog:mobile`); `ExpoAppleSignInDriver` requires it on use
  and throws a clear error without it. Never add a static import of it.
- User-facing labels live in `assets/lang/<locale>/identity.json`, all seven locales (`ar`, `de`, `en`, `es`, `fr`,
  `it`, `nl`).
- `EndErasedSubjectSessionsListener` imports @stackra/privacy's event; privacy must never depend on identity, or the
  graph closes a cycle.
- No secret, ever: a browser has no client credential (the BFF holds it, by name), and a device is a public client.
- Every BFF call carries `IdentityConfig.csrfHeader` (equal to the API's `CsrfConfig.headerName`). Never import
  @stackra/app for it: app depends on identity, so that would close a cycle.
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
- No vendor verification driver is written here (ADR 0443 decisions 7 and 8): the vendor drivers are OS integrations
  code (os-104). This package ships the vendor-neutral harness `runVerificationCase` in `./testing`; a vendor driver's
  recorded cases carry `certification: "pending"` until a sandbox run passes (owner decision D3). A harness mismatch
  names a subject field, never its value.
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
- The login directory (ADR 0451): `loginDirectoryPrefix` in `./contracts` is the only code that spells a `dir:` key;
  the writer writes only keys ending in its own region, never the identifier in clear, never a read. It declares no
  event: the host's listeners call it. Never log an identifier or the `IDENTITY_LOGIN_DIRECTORY_KEY` secret.
- `BffService` (`./node`) is the server half of `BffSessionStoreDriver`: keep its routes (`login`, `callback`,
  `session`, `logout`) and answers equal to what the driver calls. Sign-out is server-side: `logout` ends the provider
  session through `IdpAdmin.endSession` before it clears the cookie. A return URL passes `isOriginAllowed` against
  `BffConfig.returnOrigins` or is refused, never followed. It is a service, not a `Controller`: the host wraps it.
- Account deletion (STA-1567, App Store 5.1.1(v)): the account is always the actor's own `usr_` id, never a body
  field, and a call on someone's behalf is refused; asking needs `stepUp: aal2`. The job never calls `IdpAdmin`
  itself: the provider user goes only on `SubjectErased`, after the saga, so no personal data outlives the login. A
  subject a legal hold names (`SubjectHolds`) is deferred, never dropped. The grace period is
  `IdentityConfig.accountDeletionGraceDays`, never a constant. Everything acts in the session's tenant partition (the job is `perScope`; no cross-tenant read). Its code:
  `src/node/{actions,queries,drivers,database}/`, the hooks in
  `src/react/account-deletion/` and `src/native/account-deletion/`. No screen lives in core: template lines wire the
  hooks.
- Sessions (STA-1580): `ListMySessionsQuery`, `EndMySessionAction` and `EndAllMySessionsAction` act on the actor's
  own provider user only (found by its `usr_` id; a call on someone's behalf is refused). `EndMySessionAction` checks the
  session is among the caller's `IdpAdmin.listSessions` before it ends it, and answers `NotFoundError` otherwise, so a
  foreign session id is neither ended nor confirmed. `EndUserSessionsAction` is the admin call (L3, audited); the
  provider's sessions are not scoped, so it is granted to platform or support roles only. No screen in core (STA-284).
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
| Email, phone      | `loginDirectoryPrefix`, the writer     | HMAC-hashed before it leaves the region; never stored, logged or sent    |
| Directory key     | `LoginDirectoryConfig.secret`          | a secret by name (`IDENTITY_LOGIN_DIRECTORY_KEY`); never logged          |
| BFF secrets       | `BffConfig.clientSecret`, `.cookieKey` | secrets by name (`IDENTITY_BFF_*`); never logged                         |
| BFF session       | the sealed `__Host-` session cookie    | the user and the provider `sid` only, AES-GCM sealed; no token is kept   |
