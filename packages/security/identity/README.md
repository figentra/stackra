# @stackra/identity

Stackra identity, provider-neutral over ZITADEL (ADR 0206): how a client signs in (the BFF's HttpOnly cookie session
on the web, the authorization-code flow with PKCE in the system browser on desktop and mobile), the session every
screen reads, and the claims mapping that turns a provider's token into a Stackra user. Stackra builds no login UI
(ADR 0268 R3): the provider's hosted sign-in is used.

**Tier:** `tier:lib` (`packages/security/identity`). Entries `.`, `./contracts`, `./desktop`, `./native`, `./node`, `./react` and
`./testing`. Depends on `@stackra/actions` (the `./node` actions), `@stackra/clients`, `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/database` (the account deletion store), `@stackra/errors`,
`@stackra/iam`, `@stackra/privacy` (the erasure event the `./node` listener handles, and the erasure job and hold check account deletion uses), `@stackra/query` (the offline stores' session port), `@stackra/queue` and `@stackra/scheduler` (the account deletion job's generated registration), `@stackra/scope`, `@stackra/storage`,
`@stackra/support` (`ageOn`, `crc32`), `@stackra/tenancy`, `@stackra/transport`, `@stackra/validation` and zod; React is an optional peer of `./react`, vitest of `./testing`.

## What is here

| Entry         | Symbol                                                                                                                        | Use                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `.`           | `IdentityConfig`                                                                                                              | the configuration (key `identity`): flow per target, device client, scopes, idle rule          |
| `.`           | `IdentityConfig$`                                                                                                             | the shipped schema a member's generated override extends                                       |
| `.`           | `AuthFlow`                                                                                                                    | `bff`, `pkce`                                                                                  |
| `.`           | `SessionStatus`                                                                                                               | `loading`, `signed_in`, `signed_out`, `revoked`                                                |
| `.`           | `SessionService`                                                                                                              | the client's session: state, listeners, sign-in, sign-out, idle rule                           |
| `.`           | `BffSessionStoreDriver`                                                                                                       | the web's session: the BFF and its cookie                                                      |
| `.`           | `PkceSessionStoreDriver`                                                                                                      | the device's session: PKCE, tokens in the `secrets` storage area                               |
| `.`           | `MemorySessionStoreDriver`                                                                                                    | tests and previews                                                                             |
| `.`           | `SessionClientSessionDriver`                                                                                                  | `@stackra/clients`' `ClientSession`: the bearer token and `X-Scope-Path`                       |
| `.`           | `SessionOfflineSessionDriver`                                                                                                 | `@stackra/query`'s `OfflineSession`: revoked and signed-in signals, the local sign-out         |
| `.`           | `MemoryIdentityResolverDriver`                                                                                                | the contracts' `IdentityResolver` over principals in memory                                    |
| `.`           | `IDENTITY_CLAIMS`, `sessionUserOf`                                                                                            | the Stackra claim names, and claims to a `SessionUser`                                         |
| `.`           | `SignInCancelledError`, `SessionRevokedError`                                                                                 | refusals                                                                                       |
| `./contracts` | `SessionStore`                                                                                                                | the port of a flow (`load`, `signIn`, `signOut`, `accessToken`)                                |
| `./contracts` | `SignInBrowser`                                                                                                               | the platform step of PKCE: open the hosted sign-in, hand back the redirect                     |
| `./contracts` | `SessionUser`                                                                                                                 | the signed-in user: id, address, name, permissions, memberships                                |
| `.`           | `assuranceOf`, `requireAssurance`, `stepUpSignIn`, `StepUpRequiredError`                                                      | step-up: the session's level and age, the refusal, the re-authentication                       |
| `.`           | `signInProvidersOf`, `externalSignIn`                                                                                         | a market's external sign-in providers (pack data) and the hint that sends sign-in there        |
| `.`           | `StaffPinService`, `StorageStaffPinStoreDriver`, `MemoryStaffPinStoreDriver`                                                  | staff PIN quick-switch and manager override on a shared device                                 |
| `.`           | `ApiKeyKind`, `mintApiKey`, `parseApiKey`, `checkPublishableKey`, `isOriginAllowed`                                           | secret and publishable keys; the origin-bound Storefront key                                   |
| `.`           | `ApiKeyVerifierService`, `hashApiKey`, `MemoryApiKeyStoreDriver`                                                              | the gateway's verification of a key by its hash, over the `ApiKeyStore` port                   |
| `.`           | `ZitadelIdpAdminDriver`, `MemoryIdpAdminDriver`, `IdpAdminConfig`                                                             | the `IdpAdmin` port: users, machine users, sessions, device flow, login policy, methods        |
| `.`           | `signInWithPasskey`, `registerPasskey`                                                                                        | a `Passkeys` driver wired to the passkey actions (the client half)                             |
| `./node`      | `BffService`, `BffConfig`, `BffOptions`, `BffConfig$`                                                                         | the BFF's login, callback, session and logout routes with server-side sign-out                 |
| `./node`      | `ChallengePasskeyAction`, `VerifyPasskeyAction`, `RegisterPasskeyAction`, `ConfirmPasskeyAction`                              | passkey sign-in and registration over `IdpAdmin`, served by the BFF                            |
| `./node`      | `EndErasedSubjectSessionsListener`                                                                                            | ends an erased subject's provider sessions and removes its user on `SubjectErased`             |
| `./node`      | `ZitadelAuthEventsService`                                                                                                    | ZITADEL's signed auth events (sign-in, MFA, lockout, sign-out) into the audit hash chain       |
| `./contracts` | `IdpAuthEvent`                                                                                                                | the auth events the audit chain keeps                                                          |
| `./node`      | `ListMySessionsQuery` (each session a `SessionLine`), `EndMySessionAction`, `EndAllMySessionsAction`, `EndUserSessionsAction` | where you are signed in and sign out everywhere, yours or (admin) another user's; see below    |
| `./node`      | `DeleteMyAccountAction`, `CancelAccountDeletionAction`, `ShowAccountDeletionQuery`, `EraseDueAccountsAction`                  | in-app account deletion with a grace period (App Store 5.1.1(v), Play); see below              |
| `./node`      | `BootstrapOperatorAction`, `OperatorPermissions`, `BootstrapOperatorInput`, `BootstrapOperatorOutput`                         | an environment's first operator, by email, once (`stackra ops bootstrap-operator`); see below  |
| `./node`      | `PostgresAccountDeletionsDriver`, `CreateAccountDeletionsMigration`                                                           | the durable store, `identity.account_deletions`, per tenant partition                          |
| `.`           | `AccountDeletionScheduled`, `AccountDeletionCancelled`, `AccountDeletionStarted`, `MemoryAccountDeletionsDriver`              | `identity.account_deletion.{scheduled,cancelled,started}.v1`; the store in memory              |
| `./contracts` | `AccountDeletions`, `AccountDeletion`, `AccountDeletionState`                                                                 | the store of scheduled deletions; what the calls answer                                        |
| `./react`     | `useAccountDeletion`                                                                                                          | the settings section: the date, request, cancel                                                |
| `./native`    | `useAccountDeletionSheet`                                                                                                     | the same with the device's biometric check before a request                                    |
| `.`           | `MemoryAutomationPrincipalsDriver`                                                                                            | the `AutomationPrincipals` port in memory: one principal per automation (ADR 0153)             |
| `.`           | `GuardianActingService`, `MemoryGuardianshipDriver`                                                                           | a guardian acting for a minor, after the relationship check                                    |
| `.`           | `VerificationService`, `MemoryVerificationDriver`                                                                             | KYC and KYB through the providers the market pack lists                                        |
| `./contracts` | `Verification`, `VerificationKind`, `VerificationStatus`, `StaffPinStore`, `Guardianship`, `SignInOptions`                    | the verification, PIN and guardianship ports; sign-in extras                                   |
| `./contracts` | `IdpSecondFactor`                                                                                                             | the second factors a login policy offers (`totp`, `u2f`, `otp_email`, `otp_sms`)               |
| `./contracts` | `AutomationPrincipals`, `AutomationPrincipalInput`                                                                            | mint and revoke the principal an automation runs as (ADR 0153 decision 2)                      |
| `.`           | `SignInMethod`, `signInMethodsOf`                                                                                             | the built-in sign-in methods a market offers (pack data), less the scope's switched-off ones   |
| `.`           | `AppApprovalService`, `MemoryAppApprovalChallengesDriver`                                                                     | sign-in and step-up by approving on the mobile app (number matching, QR)                       |
| `.`           | `AppApprovalRequested`, `AppApprovalApproved`, `AppApprovalDenied`                                                            | `sessions.app_approval.{requested,approved,denied}.v1`; notifications pushes on the first      |
| `./contracts` | `AppApprovalChallenges`, `AppApprovalChallenge`, `AppApprovalPurpose`, `AppApprovalStatus`                                    | the challenge store and the bound devices                                                      |
| `.`           | `LoginDirectoryWriterService`, `LoginDirectoryConfig`, `MemoryLoginDirectoryStoreDriver`                                      | this region's rows of the global login directory: `record` and `forget` identifiers (ADR 0451) |
| `./contracts` | `LoginDirectoryStore`, `loginDirectoryPrefix`, `LoginIdentifierKind`, `LoginIdentifier`, `LoginDirectoryKey`                  | the directory store port and the one key format, shared with the edge Worker                   |
| `./react`     | `useAppApprovalWait`                                                                                                          | the web's waiting screen: the number, the QR token, the poll                                   |
| `./native`    | `useAppApprovalSheet`                                                                                                         | the app's approve sheet: requester details, numbers, biometric check, approve, deny, scan      |
| `./contracts` | `Passkeys`, `PasskeyRefusal`, `PasskeyCreationOptions`, `PasskeyRequestOptions`, `PasskeyCredential`, `PasskeyResult`         | the device step of a passkey registration or sign-in, refusals as values                       |
| `.`           | `MemoryPasskeysDriver`                                                                                                        | passkeys in memory: tests, web, local runs                                                     |
| `./native`    | `ExpoPasskeysDriver`                                                                                                          | Expo: the iOS and Android credential manager through `react-native-passkey`                    |
| `.`           | `SocialProvider`                                                                                                              | the providers offered in every market once configured: `apple`                                 |
| `./contracts` | `AppleSignIn`, `AppleSignInRefusal`, `AppleCredential`, `AppleSignInResult`                                                   | the native Sign in with Apple device step, refusals as values                                  |
| `./native`    | `ExpoAppleSignInDriver`                                                                                                       | Expo on iOS: the Apple sheet through `expo-apple-authentication`, required on use              |
| `./native`    | `ExpoSignInBrowserDriver`                                                                                                     | Expo: the system authentication session and the app's link                                     |
| `./desktop`   | `ElectronSignInBrowserDriver`                                                                                                 | Electron main: the system browser and a loopback redirect                                      |
| `./react`     | `useSession`, `SessionValue`, `SignedInSession`                                                                               | the session in a component                                                                     |
| `./testing`   | `fakeSession`, `SessionFake`, `fakeIdentity`                                                                                  | a session in any status with spied actions; a resolver over named principals                   |
| `./testing`   | `runVerificationCase`, `VerificationCase`, `VerificationCaseResult`                                                           | the recorded-fixture harness every `Verification` driver (OS integrations) runs its cases on   |

## Configuring a member

```ts
// src/config/identity.config.ts of the console
import { Target } from "@stackra/contracts";
import { AuthFlow, IdentityConfig as BaseIdentityConfig } from "@stackra/identity";

export class IdentityConfig extends BaseIdentityConfig {
  override flow: Record<string, AuthFlow> = {
    [Target.Web]: AuthFlow.Bff,
    [Target.Pwa]: AuthFlow.Bff,
    [Target.Desktop]: AuthFlow.Pkce,
  };
  override idleMinutes = 30; // a forgotten shared till signs out
}
```

The flow per target picks the `SessionStore` driver gen wires for that target. A browser holds no client credential;
a device is a public client whose `issuer` and `clientId` are public values that runway's `config.identity` layer sets
per environment. No secret is ever in this configuration.

## The session

```tsx
const session = useSession();
if (session.status !== SessionStatus.SignedIn)
  return <Button onPress={() => session.signIn()}>Sign in</Button>;
return <Avatar name={session.user.displayName} src={session.user.avatarUrl} />;
```

- `useSession` starts the `SessionService` on mount; a server render stays `loading`. A failure to read the session
  leaves it signed out and goes to the bound `ErrorReporter`.
- Every state hands its memberships to `@stackra/tenancy`'s `TenantSwitcher`, so the switcher and the active scope
  follow the session.
- Every state sets the user's permission keys into `@stackra/iam`'s `PermissionSnapshotService` (empty when signed
  out), so `usePermission()` hides the same controls the session allows. Presentation only: the producer checks every
  call.
- `signIn` rejects `SignInCancelledError` when the user closes the hosted page; the page shows it inline.
- With `idleMinutes` set, a client without a pointer or key press for that long signs out. With `refreshOnFocus`, a
  window coming back into view reads the session again.
- `revoked` means the provider refused the device's session (revoked from "Sessions", or past its lifetime). The stores
  that hold offline data wipe on it and the client waits for a new sign-in (ADR 0338 decision 4).

## Revoke means wipe and lock

Bind `SessionOfflineSessionDriver` as `@stackra/query`'s `OfflineSession`. Its `isRevoked` signal turns on with
`SessionStatus.Revoked`, and `@stackra/query`'s `OfflineLock` then wipes the `outbox`, `cache` and `secrets` areas,
the device's queued calls, replicas, tokens and payload key, and locks. Its `isSignedIn` signal turning on again (a
fresh sign-in, since the wipe took the stored tokens) unlocks the device. When the tenant's offline limit (24 hours by
default) passes without a sync, the lock wipes the same way and calls the driver's `end`, which signs out on the
device even when the provider cannot be told.

An erasure revokes too: `./node`'s `EndErasedSubjectSessionsListener` handles @stackra/privacy's `SubjectErased` and
ends every provider session of the erased subject, so each of its devices turns `revoked` on its next refresh and wipes
what it keeps, the on-device search index among it; then it removes the subject's provider user, so it cannot sign in
again and the provider's copy of its name and email is gone. The user is found by the `stackra_user_id` metadata, so
provisioning must pass `IdpUserInput.stackraUserId` to `createUser`; a user created without it is not found, and the
listener logs `identity.erasure.no_provider_user` with the erasure id. It lives here because privacy does not depend on identity.

## The flows

The BFF (web, PWA): `GET <api><bffEndpoint>/session` answers `{ user } | null` with the cookie; sign-in leaves for
`<api><bffEndpoint>/login?returnTo=<path>`; sign-out posts to `/logout`. No token reaches JavaScript. Every BFF call
carries the CSRF header `csrfHeader` (default `x-stackra-csrf`), which @stackra/app's `CsrfGuard` requires on a
cookie-bearing POST; keep it equal to the API's `app.csrf.headerName`.

The server half is `./node`'s `BffService`; the host serves it from one raw endpoint (identity cannot import
@stackra/app, which depends on it):

```ts
export class AuthController extends Controller({ path: "/api/auth/*" }) {
  constructor(private readonly bff: BffService) {
    super();
  }
  handle(request: Request): Promise<Response> {
    return this.bff.handle(request);
  }
}
```

A raw endpoint that needs the caller reads the same cookie with `sessionOf` and passes the actor in the call's options,
as every caller of the action pipeline does (`CallOptions.actor`, ADR 0098):

```ts
export class ExportOrdersController extends Controller({ path: "/orders/export" }) {
  constructor(
    private readonly bff: BffService,
    private readonly pipeline: ActionPipeline,
  ) {
    super();
  }
  async handle(request: Request): Promise<Response> {
    const session = await this.bff.sessionOf(request); // undefined: no, forged or expired cookie
    if (session === undefined) return new Response(null, { status: 401 });
    const actor = { kind: ActorKind.User, id: session.user.userId, realm: Realm.Staff } as const;
    return Response.json(await this.pipeline.execute(ExportOrdersAction, {}, { actor }));
  }
}
```

| Route          | Does                                                                                                                                                                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET login`    | checks `returnTo` (an in-app path, or a URL on a `BffConfig.returnOrigins` origin; else 400), seals state, nonce and PKCE verifier in `<cookieName>_flow`, redirects to the provider                                                           |
| `GET callback` | checks the state, exchanges the code (client secret by HTTP Basic), checks the ID token's issuer, audience, expiry, nonce and `sid`, sets the session cookie, returns to `returnTo`; any failure returns with `sign_in_error=1` and no session |
| `GET session`  | `{ user }`, or 401 (`sessionOf(request)` is the same read for a host)                                                                                                                                                                          |
| `POST logout`  | needs the CSRF header; `IdpAdmin.endSession(sid)` (a failure throws and keeps the cookie), clears the cookie, answers `{ redirectTo }`, the provider's end-session URL                                                                         |

Both cookies are `__Host-…; Path=/; HttpOnly; Secure; SameSite=Lax`, sealed with AES-GCM under `BffConfig.cookieKey`
(the cookie name is the associated data). The session cookie holds the user and the provider session id, never a
token. `BffConfig` (key `bff`, server only, from `./node`): `redirectUri`, `returnOrigins` (the first is exact and is
where a path resolves), `postLogoutUri`, `cookieName` (default `__Host-stackra_session`), `sessionMinutes` (480),
`flowMinutes` (10), and the secrets `IDENTITY_BFF_CLIENT_SECRET` and `IDENTITY_BFF_COOKIE_KEY` (at least 32
characters). The issuer, client id and scopes are `IdentityConfig`'s. The ID token comes straight from the token
endpoint, so its signature is not checked (OpenID Connect Core 3.1.3.7).

PKCE (desktop, mobile): the issuer's discovery document gives the endpoints; sign-in sends an `S256` request through
the platform's `SignInBrowser`, checks the state, exchanges the code with the verifier, checks the ID token's issuer,
audience, expiry and nonce, and keeps the tokens and the user in the `secrets` storage area. The access token is renewed
a minute before it expires, with the refresh token rotated; `invalid_grant` drops the tokens (`revoked`), and any other
failure keeps the session so a signed-in device works through a provider outage (ADR 0206 decision 9). The flow needs
WebCrypto. No `SignInBrowser` driver ships here yet: the Expo and Electron ones come with their platform entries.

## Passkeys and password autofill

The hosted sign-in already offers passkeys and saved passwords: the system authentication session behind
`ExpoSignInBrowserDriver` is the browser, so iCloud Keychain, Google Password Manager and other credential providers
fill the provider's page with no app code. `Passkeys` is for an app that offers a passkey button of its own (ADR 0268
R3 still holds: a button, not a login form):

```ts
const passkeys = useContainer().get(Passkeys);
if (!passkeys.isSupported()) return; // hide the button
const result = await signInWithPasskey(passkeys, loginName, {
  challenge: (input) => client.identity.passkey.challenge(input), // POST /passkeys/challenge
  verify: (input) => client.identity.passkey.verify(input), // POST /passkeys/verify
});
if (!result.ok && result.error === PasskeyRefusal.NoCredential) await session.signIn(); // the hosted sign-in
```

The server half is `./node`'s actions, which the BFF serves over `IdpAdmin`:

| Action                                         | Actor     | Does                                                                                         |
| ---------------------------------------------- | --------- | -------------------------------------------------------------------------------------------- |
| `ChallengePasskeyAction` (`passkey.challenge`) | anonymous | a ZITADEL v2 session with the login's user check and a `webAuthN` challenge; its `publicKey` |
| `VerifyPasskeyAction` (`passkey.verify`)       | anonymous | the session's `checks.webAuthN`; answers the verified session the BFF turns into its own     |
| `RegisterPasskeyAction` (`passkey.register`)   | user      | `POST /v2/users/{id}/passkeys` for the caller's own provider user; its `publicKey`           |
| `ConfirmPasskeyAction` (`passkey.confirm`)     | user      | `POST /v2/users/{id}/passkeys/{passkeyId}` with the credential and a name                    |

The sign-in pair runs in the public API area with its own bucket (10 a minute); a refused credential or an unknown
login is `UnauthenticatedError`. `registerPasskey(passkeys, name, { register, confirm })` is the client half of
registration. The caller's provider user is found by its `usr_` id, which `IdpAdmin.createUser` keeps as the
`stackra_user_id` metadata (`stackraUserId`). The relying party is the provider's domain (the host of
`IdpAdminConfig.url`), so the app must list it: `webcredentials:<issuer host>` in the iOS associated domains, and the
provider's domain must serve `/.well-known/apple-app-site-association` (`webcredentials.apps`) and
`/.well-known/assetlinks.json` (`delegate_permission/common.get_login_creds`) for the app's team id, bundle id and
signing certificate. Without them every call refuses `unsupported`. `ExpoPasskeysDriver` needs
`react-native-passkey` in the app's own dependencies (native code, autolinked at prebuild); the web and tests use
`MemoryPasskeysDriver`.

## Step-up, external providers, PINs, keys, guardians and verification

- **Step-up.** (`AssuranceLevel` is `@stackra/contracts`'.) `requireAssurance(assuranceOf(claims, identity), AssuranceLevel.Aal2, identity, now)` refuses
  `step_up_required` when the level is lower or the authentication is older than `stepUpMaxAgeMinutes`; the client then
  calls `session.signIn(stepUpSignIn())`. Which actions need it is rule and settings data.
- **App approval** (GitHub Mobile style). `AppApprovalService.request({ purpose, requester, loginHint })` answers a
  ticket: the number the web shows, the QR token it draws, and a poll secret. The signed-in app lists
  `pending(approver)` (the requester's device, IP, coarse location and user agent, and the number plus
  `appApprovalDecoys` decoys), runs its biometric check and calls `approve(id, approver, number)`; a wrong number
  denies. Scanning the QR code calls `redeem(qrToken, approver)` and approves with no number. The web polls
  `status(id, pollSecret)` (`pending`, `approved` or `ended`, never more) and calls `complete` once for the
  `AppApprovalGrant` its BFF turns into a session, or, with `purpose: "step_up"` and the `sessionId`, into a fresher
  authentication for `stepUpMaxAgeMinutes`. An unknown account gets a ticket that looks the same and lapses. Only a
  device bound through `AppApprovalChallenges.bindDevice` answers (`appApprovalEnrolledDevicesOnly`); one pending
  challenge per principal per requesting device; `appApprovalMaxRequests` per `appApprovalWindowMinutes` per device
  and per target. Time to live, digits, decoys and the assurance reached are `IdentityConfig` values; `app_approval`
  is offered where the pack lists it under `signInMethodsKey`.
- **External providers.** A market pack lists its sign-in providers under `signInProvidersKey`; `externalProviders`
  maps each to its id at this deployment. `session.signIn(externalSignIn(key, identity))` sends the hosted sign-in
  straight there.
- **Sign in with Apple** (STA-1578, App Store guideline 4.8). Set `externalProviders.apple` to the id of ZITADEL's
  Apple provider (`@stackra/infra-identity`'s `appleIdp` output); `signInProvidersOf` then offers `apple` in every
  market, after the pack's providers, and `externalSignIn(SocialProvider.Apple, identity)` sends the hosted sign-in
  (web, desktop, and the phone's system authentication session) to Apple through ZITADEL. A phone app that wants
  Apple's native sheet uses the `AppleSignIn` port: `ExpoAppleSignInDriver` needs `expo-apple-authentication` in the
  app (an optional peer, `catalog:mobile`; without it every call throws an error naming it), the app renders that
  library's `AppleAuthenticationButton`, and the server checks the token's nonce and exchanges it (not built here).
  An iOS app that offers any social provider must offer Apple too; runway's `mobile.<app>.signIn.social` refuses one
  that does not and adds the `com.apple.developer.applesignin` entitlement. The labels are
  `identity::enums.social_provider.apple` and `identity::ui.sign_in.continue_with_apple`.
- **Staff PINs.** `StaffPinService.enrol`, `switchTo` and `override` keep a salted PBKDF2 hash per device and staff
  member (in the `secrets` area on the till), lock out after `pinMaxAttempts`, and check the manager's permission
  through the IAM decision point.
- **API keys.** `mintApiKey(ApiKeyKind.Publishable, identity)` makes a prefixed, checksummed key; the gateway calls
  `checkPublishableKey(key, origin, record.origins, identity)` before the lookup. The identity service stores
  `hashApiKey(key)` only; the gateway calls `ApiKeyVerifierService.verify(key, origin)`, which refuses a malformed key
  without a lookup, then reads the record by hash through `ApiKeyStore` and checks revocation, expiry and the origin.
  A passing key's use is written through `ApiKeyStore.recordUse(id, at)` (the record's `lastUsedAt`, for key hygiene)
  when the last one is older than `apiKeyLastUsedSeconds` (60; `0` writes every time). A failed write never refuses
  the key. A store without the column keeps the port's no-op default.
- **IdP admin.** `IdpAdmin` creates users and machine users, lists and ends sessions, runs the device flow and sets login
  policies. `ZitadelIdpAdminDriver` reads `IdpAdminConfig` (key `idp_admin`): the URL of the managed or the tenant's own
  ZITADEL, and the `IDENTITY_IDP_ADMIN_TOKEN` secret. `listAuthMethods(userId)` answers a user's enrolled methods as
  RFC 8176 `amr` codes, so `assuranceOf({ amr: methods }, identity).level` is the level they reach: the security
  page's MFA enrolment list compares it with the MFA rule's level. A `LoginPolicy` may list `externalProviderIds`
  (the market pack's sign-in providers through `IdentityConfig.externalProviders`) and `secondFactors`
  (`IdpSecondFactor`); the organisation then offers exactly those, and a list left out is not touched.
- **Automation principals.** `AutomationPrincipals.mint({ automationId, scopeId, name })` gives an automation its own
  `service` principal (ADR 0153 decision 2), the same one on every publish until `revoke(principalId)`. The identity
  service implements it over its principals table; `MemoryAutomationPrincipalsDriver` serves tests. Its grants are
  the publisher's choice, checked by `@stackra/workflow`'s `PublisherAccess`.
- **Guardians.** `GuardianActingService.actFor(actor, minor, { purpose, birthDate, ageOfMajority })` checks the link,
  its restrictions and the pack's age, and returns the delegated principal to record.
- **Verification.** `VerificationService.register(key, driver)` wires providers; `verify(request, resolved, on)` tries
  the providers the pack lists under `verificationPackKey` for the request's kind, in order.
  `verifyThrough(request, candidates)` runs it through the Connections `ProviderResolver#candidates("verification", …)`
  of `@stackra/integrations` answers instead. `request.use` says whose check it is: `platform` (the default; Figentra's
  own KYB and KYC of a tenant) is pinned to platform Connections (`{ pin: "managed" }`) and an `own` candidate is
  skipped again here; `tenant` (a tenant checking its customers) takes the tenant's own Connection first, then the
  managed one. The result carries the `mode` that answered. Vendor Connections live in the OS integrations service.
- **Verification drivers.** The vendor drivers (Wathq, ZATCA lookup, Nafath, UAE Pass, Didit, Uqudo or Sumsub,
  ComplyAdvantage; Middesk and Persona for the US pack) are OS integrations code (ADR 0443 decision 7, os-104); this
  package keeps the port, `VerificationService`, `MemoryVerificationDriver` and the harness below. Each vendor driver
  ships recorded cases from the vendor's public documentation, marked `certification: "pending"` until a run against
  the vendor's sandbox passes (owner decision D3, 2026-10-27).

## Sessions: where you are signed in, sign out everywhere

`./node`'s session calls (STA-1580) act on the identity provider's sessions through `IdpAdmin`, permissions in
`SessionPermissions` (ADR 0462). The screens belong to the template lines (STA-284); core ships no UI and no lang keys.

| Call                                               | Who                         | What                                                                     |
| -------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------ |
| `ListMySessionsQuery` (`session.list@1`, L1)       | the signed-in user          | the caller's live sessions: id, `createdAt`, `lastActiveAt`, `userAgent` |
| `EndMySessionAction` (`session.end@1`, L2)         | the signed-in user          | ends one of the caller's own sessions; another's is `NotFoundError`      |
| `EndAllMySessionsAction` (`session.end_all@1`, L2) | the signed-in user          | ends every session of the caller, this device's too; answers `{ ended }` |
| `EndUserSessionsAction` (`session.end_user@1`, L3) | an administrator or service | ends every session of the `usr_` subject; audited with the count         |

The caller's provider user is found by the actor's `usr_` id, never a body field; a call on someone else's behalf is
refused. Each device sees `SessionStatus.Revoked` on its next refresh. The provider's sessions span every scope a person
belongs to and identity holds no membership, so grant `identity.session.end_user` to platform or support roles only.

## Account deletion (App Store 5.1.1(v), Play)

App Store Review Guideline 5.1.1(v) and Google Play's account deletion policy ask that an app which lets people create
an account lets them delete it from inside the app. This package ships the server side and the client hooks; the screen
belongs to the template line (os/mobile, os/console), never to core's reference app.

1. **Ask.** `DeleteMyAccountAction` (`identity.account_deletion.request@1`, `POST /account-deletion`) schedules the
   caller's own account (the actor's `usr_` id, never a body field; a call on someone else's behalf is refused). It
   needs a fresh step-up (`stepUp: aal2`): an old sign-in gets `step_up_required`, the screen signs in with `stepUpSignIn()` and
   asks again. It answers `{ requestedAt, dueAt }`, `dueAt` being `IdentityConfig.accountDeletionGraceDays` later (30
   by default, 0 to 90), and records `identity.account_deletion.scheduled.v1`. Asking again answers the same date.
2. **Change of mind.** `CancelAccountDeletionAction` (`.cancel@1`, `DELETE /account-deletion`) removes it and records
   `identity.account_deletion.cancelled.v1`; `ShowAccountDeletionQuery` (`.read@1`) answers the date for the screen.
3. **Erasure.** The hourly system job `EraseDueAccountsAction` (`.erase@1`) runs once per scope and takes that scope's
   due ones. A subject a live legal hold names (`@stackra/privacy/contracts`' `SubjectHolds`) is pushed back a day and
   logged by erasure id, so held ones never take the batch; any other is handed
   to privacy's `EraseSubjectAction` (the erasure saga, which keeps held rows too) and records
   `identity.account_deletion.started.v1`. The saga's `SubjectErased` reaches `EndErasedSubjectSessionsListener`,
   which ends every provider session and then removes the provider user: personal data first, the login last.

A host binds `AccountDeletions` to `PostgresAccountDeletionsDriver` (`./node`, migration `identity.0001`,
`identity.account_deletions`; `MemoryAccountDeletionsDriver` in tests and previews) and `SubjectHolds` to privacy's
`PostgresSubjectHoldsDriver`, and serves the three user calls through its BFF. Both stores, the hold check and the
erasure act in the session's tenant partition (null or `-` outside one) under forced row-level security; nothing reads
across tenants. A deletion is found in the tenant whose session asked for it.

**Wiring the screen in a template line.** The settings screen calls the generated client through the hook and takes
its words from the `identity.ui.account_deletion` lang keys (`assets/lang/<locale>/identity.json`, seven locales):

```tsx
// os/mobile: app/(settings)/account.tsx
import { stepUpSignIn, StepUpRequiredError } from "@stackra/identity";
import { useSession } from "@stackra/identity/react";
import { useAccountDeletionSheet } from "@stackra/identity/native";
import { authenticateAsync } from "expo-local-authentication";

const deletion = useAccountDeletionSheet({
  load: () => api.identity.accountDeletion.read({}),
  request: () => api.identity.accountDeletion.request({}),
  cancel: () => api.identity.accountDeletion.cancel({}),
  verify: () =>
    authenticateAsync({ promptMessage: t("identity.ui.account_deletion.verify_prompt") }).then(
      (r) => r.success,
    ),
});
const session = useSession();
if (deletion.error instanceof StepUpRequiredError) await session.signIn(stepUpSignIn()); // then deletion.request() again
return deletion.dueAt ? (
  <Notice
    text={t("identity.ui.account_deletion.scheduled", { date: formatDate(deletion.dueAt) })}
    action={deletion.cancel}
  />
) : (
  <DangerButton onPress={deletion.request}>
    {t("identity.ui.account_deletion.confirm")}
  </DangerButton>
);
```

The console (os/console) does the same with `useAccountDeletion` from `./react`, with no device check. Put the entry
where App Review finds it (Settings, Account), not behind support, and keep the screen reachable while a deletion is
scheduled so it can be cancelled.

## Operator bootstrap (STA-1586)

An environment's operator roster starts empty, and nobody can grant the first operator through the UI.
`BootstrapOperatorAction` (`identity.operator.bootstrap@1`, `POST /platform/operators/bootstrap`, platform area) gives
the user with an email a role at the platform node, the root of the scope tree: `SystemRole.Owner` unless `role`
names another. It finds the provider's one human user with the email and its `stackra_user_id`
(`IdpAdmin.findStackraUserId`; two users with the email is an error, never a guess), reads the roles the user holds
there (`RolesAtNode`) and writes the grant through `@stackra/iam/contracts`' `RoleGrants`, which the IAM service binds.
It answers `OperatorBootstrapOutcome`: `granted`, `already_granted` (nothing written), `would_grant` (`dryRun`,
nothing written) or `not_found`. The pipeline audits every call; the action adds the user id, role and outcome, never
the email.

`OperatorPermissions.bootstrap` is L4 and system-held: only a service principal acting for no one passes the decision
point, so no user, operator or agent can call it. The caller is the environment's bootstrap credential: a ZITADEL
service account of that environment whose token the gateway verifies into a `service` actor. The owner runs it with
`stackra ops bootstrap-operator --env <env> --email <email>` (the CLI README and the deploys runbook say where the
token comes from).

## The login directory (ADR 0451)

Sign-in finds a person's region through a global directory that holds keyed hashes only (ADR 0353 decision 4).
`loginDirectoryPrefix` is the one key format: the identifier normalised (email lower-cased, phone E.164), HMAC-SHA-256
under the directory key, `dir:<key id>:<kind>:<hex>:`. A region writes `<prefix><region>`; the edge Worker
(`@stackra/infra-cloudflare`'s `loginDirectoryHandler`) lists the prefix.

The host's listeners on its own identity events call `LoginDirectoryWriterService`: `record` on an account created or
an identifier verified, `forget` of the old and `record` of the new on a change, `forget` of all on delete. Configure
`LoginDirectoryConfig` per region (`region`, `keyId`; the key is the `IDENTITY_LOGIN_DIRECTORY_KEY` secret) and bind a
`LoginDirectoryStore` driver that sends `loginDirectoryKvRequest` calls. Tenant handles are tenancy's, not here.

## Auth events in the audit chain (STA-1579)

Sign-in, failed sign-in, second-factor, lockout and sign-out happen inside ZITADEL. `ZitadelAuthEventsService` is the
receiving end of a ZITADEL Actions v2 **event** target: it verifies the `ZITADEL-Signature` header (HMAC-SHA256 of
`<t>.<raw body>`, five minutes' tolerance, Web Crypto) with `IdpAdminConfig.eventsSigningKey` (the
`IDENTITY_IDP_EVENTS_SIGNING_KEY` secret) before parsing, maps the event type to an `IdpAuthEvent`, and writes one
`AuditEntry` through `@stackra/actions`' `AuditTrail` port, so `@stackra/access-log`'s `postgres` driver chains it in
the scope's write audit. The key is `identity.idp_auth_event.<event>@1`; failures and lockouts are `refused` with the
event as the code; the actor is the webhook source `whk_zitadel`, and `fields` hold the provider's user, organisation,
event type and sequence (ids only; the event payload, with IP and user agent, is never stored). Other event types are
acknowledged and ignored. The host passes the organisation-to-scope mapping, and serves it from a raw endpoint:

```ts
export class IdpEventsController extends Controller({ path: "/webhooks/zitadel/auth-events" }) {
  constructor(
    private readonly events: ZitadelAuthEventsService,
    private readonly orgs: OrgScopes,
  ) {
    super();
  }
  handle(request: Request): Promise<Response> {
    return this.events.handle(request, (org) => this.orgs.scopeOf(org));
  }
}
```

**Owner step:** the ZITADEL target and execution are not in `@stackra/infra-identity`'s Pulumi slice, because the
pinned provider (`@pulumiverse/zitadel` 0.2.0) has no Actions v2 `Target`/`Execution` resource. Create them once per
instance through the ZITADEL console or the v2 Actions API: a `restWebhook` target to the endpoint above (copy its
signing key into the `IDENTITY_IDP_EVENTS_SIGNING_KEY` secret), and an event execution on the event types listed in
`ZITADEL_AUTH_EVENTS` (`user.human.password.check.succeeded`/`failed`, `user.human.passwordless.token.check.*`,
`user.human.externallogin.check.succeeded`, `user.human.mfa.otp.check.*`, `user.human.u2f.token.check.*`,
`user.human.otp.sms.check.*`, `user.human.otp.email.check.*`, `user.locked`, `user.human.signed.out`,
`session.terminated`).

## The claims

A Stackra token carries, besides `email`, `name` and `picture`:

| Claim (`IDENTITY_CLAIMS`)                 | Holds                                                                                  |
| ----------------------------------------- | -------------------------------------------------------------------------------------- |
| `userId` = `urn:stackra:user_id`          | the `usr_` public id                                                                   |
| `memberships` = `urn:stackra:memberships` | `[{ scopeId: "scp_…", path, name, roles }]`                                            |
| `scopePath` = `urn:stackra:scope_path`    | the scope the token was issued for; scope's `SCOPE_PATH_CLAIM`, read by its claim step |
| `permissions` = `urn:stackra:permissions` | the permission names held in that scope (presentation only)                            |

On ZITADEL the identity service's action adds them, mapping each organisation to its scope node. `sessionUserOf` maps
them to a `SessionUser`, whose memberships are the tenancy package's `TenantMembership`.

## Calls

Bind `SessionClientSessionDriver` as `@stackra/clients`' `ClientSession`: each call carries `Authorization: Bearer …`
on a PKCE session and the active scope's path as `X-Scope-Path`; `can(permission)` reads the user's permissions.

## Testing

```ts
const session = fakeSession({ status: SessionStatus.SignedIn, memberships: 2 });
const [first, second] = session.user.memberships;
renderRoute(Routes.profile, { session }); // binds it as SessionService

const signedOut = fakeSession({
  status: SessionStatus.SignedOut,
  signIn: () => Promise.reject(SignInCancelledError.create()),
});
expect(signedOut.signIn).toHaveBeenCalled();

createTestingModule(NotificationsModule).override(
  IdentityResolver,
  fakeIdentity({ [customer.id]: { email: "a@acme.example", locale: "ar" } }),
);
```

The memory drivers and `SessionFake` take no constructor data, since gen reads every constructor parameter as an
injected class: `seed` sets what they hold and returns the instance
(`new MemoryVerificationDriver(clock).seed([VerificationKind.Company])`,
`new MemoryGuardianshipDriver().seed(links)`, `new MemorySessionStoreDriver().seed(user, true)`,
`new MemoryIdentityResolverDriver().seed(principals)`, `new SessionFake().seed({ status })`). `ZitadelIdpAdminDriver`
calls the global fetch, so a test stubs it with `vi.stubGlobal("fetch", ...)`.

A `Verification` driver runs each recorded case through `runVerificationCase`, which checks the recorded status,
reasons and provider reference and the port's rules: the kind is supported, an outage refuses
`verification_unavailable` (so `VerificationService` falls through), reasons are snake_case codes and empty when
verified, `checkedAt` is a real time, and no subject fact comes back in the answer.

```ts
const api = fakeIntegrationApi({ "POST /v2/session": { status: 200, body: recorded } });
const result = await runVerificationCase(new VendorVerificationDriver(api.connection), {
  id: "vendor.identity-verified",
  source: "vendor API reference, session decision",
  certification: "pending",
  request: {
    kind: VerificationKind.Identity,
    market: "sa",
    reference: "chk_1",
    subject,
    consented: true,
  },
  expect: { status: VerificationStatus.Verified },
});
expect(result.mismatches).toEqual([]);
```
