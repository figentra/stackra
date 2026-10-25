# @stackra/identity

Stackra identity, provider-neutral over ZITADEL (ADR 0206): how a client signs in (the BFF's HttpOnly cookie session
on the web, the authorization-code flow with PKCE in the system browser on desktop and mobile), the session every
screen reads, and the claims mapping that turns a provider's token into a Stackra user. Stackra builds no login UI
(ADR 0268 R3): the provider's hosted sign-in is used.

**Tier:** `tier:lib` (`packages/security/identity`). Entries `.`, `./contracts`, `./react` and `./testing`. Depends on
`@stackra/clients`, `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/errors`,
`@stackra/iam`, `@stackra/query` (the offline stores' session port), `@stackra/scope`, `@stackra/storage`,
`@stackra/tenancy`, `@stackra/transport`, `@stackra/validation` and zod; React is an optional peer of `./react`, vitest of `./testing`.

## What is here

| Entry         | Symbol                                                                                                     | Use                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `.`           | `IdentityConfig`                                                                                           | the configuration (key `identity`): flow per target, device client, scopes, idle rule   |
| `.`           | `IdentityConfig$`                                                                                          | the shipped schema a member's generated override extends                                |
| `.`           | `AuthFlow`                                                                                                 | `bff`, `pkce`                                                                           |
| `.`           | `SessionStatus`                                                                                            | `loading`, `signed_in`, `signed_out`, `revoked`                                         |
| `.`           | `SessionService`                                                                                           | the client's session: state, listeners, sign-in, sign-out, idle rule                    |
| `.`           | `BffSessionStoreDriver`                                                                                    | the web's session: the BFF and its cookie                                               |
| `.`           | `PkceSessionStoreDriver`                                                                                   | the device's session: PKCE, tokens in the `secrets` storage area                        |
| `.`           | `MemorySessionStoreDriver`                                                                                 | tests and previews                                                                      |
| `.`           | `SessionClientSessionDriver`                                                                               | `@stackra/clients`' `ClientSession`: the bearer token and `X-Scope-Path`                |
| `.`           | `SessionOfflineSessionDriver`                                                                              | `@stackra/query`'s `OfflineSession`: revoked and signed-in signals, the local sign-out  |
| `.`           | `MemoryIdentityResolverDriver`                                                                             | the contracts' `IdentityResolver` over principals in memory                             |
| `.`           | `IDENTITY_CLAIMS`, `sessionUserOf`                                                                         | the Stackra claim names, and claims to a `SessionUser`                                  |
| `.`           | `SignInCancelledError`, `SessionRevokedError`                                                              | refusals                                                                                |
| `./contracts` | `SessionStore`                                                                                             | the port of a flow (`load`, `signIn`, `signOut`, `accessToken`)                         |
| `./contracts` | `SignInBrowser`                                                                                            | the platform step of PKCE: open the hosted sign-in, hand back the redirect              |
| `./contracts` | `SessionUser`                                                                                              | the signed-in user: id, address, name, permissions, memberships                         |
| `.`           | `AssuranceLevel`, `assuranceOf`, `requireAssurance`, `stepUpSignIn`, `StepUpRequiredError`                 | step-up: the session's level and age, the refusal, the re-authentication                |
| `.`           | `signInProvidersOf`, `externalSignIn`                                                                      | a market's external sign-in providers (pack data) and the hint that sends sign-in there |
| `.`           | `StaffPinService`, `StorageStaffPinStoreDriver`, `MemoryStaffPinStoreDriver`                               | staff PIN quick-switch and manager override on a shared device                          |
| `.`           | `ApiKeyKind`, `mintApiKey`, `parseApiKey`, `checkPublishableKey`, `isOriginAllowed`                        | secret and publishable keys; the origin-bound Storefront key                            |
| `.`           | `GuardianActingService`, `MemoryGuardianshipDriver`                                                        | a guardian acting for a minor, after the relationship check                             |
| `.`           | `VerificationService`, `MemoryVerificationDriver`                                                          | KYC and KYB through the providers the market pack lists                                 |
| `./contracts` | `Verification`, `VerificationKind`, `VerificationStatus`, `StaffPinStore`, `Guardianship`, `SignInOptions` | the verification, PIN and guardianship ports; sign-in extras                            |
| `./native`    | `ExpoSignInBrowserDriver`                                                                                  | Expo: the system authentication session and the app's link                              |
| `./desktop`   | `ElectronSignInBrowserDriver`                                                                              | Electron main: the system browser and a loopback redirect                               |
| `./react`     | `useSession`, `SessionValue`, `SignedInSession`                                                            | the session in a component                                                              |
| `./testing`   | `fakeSession`, `SessionFake`, `fakeIdentity`                                                               | a session in any status with spied actions; a resolver over named principals            |

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

## The flows

The BFF (web, PWA): `GET <api><bffEndpoint>/session` answers `{ user } | null` with the cookie; sign-in leaves for
`<api><bffEndpoint>/login?returnTo=<path>`; sign-out posts to `/logout`. No token reaches JavaScript.

PKCE (desktop, mobile): the issuer's discovery document gives the endpoints; sign-in sends an `S256` request through
the platform's `SignInBrowser`, checks the state, exchanges the code with the verifier, checks the ID token's issuer,
audience, expiry and nonce, and keeps the tokens and the user in the `secrets` storage area. The access token is renewed
a minute before it expires, with the refresh token rotated; `invalid_grant` drops the tokens (`revoked`), and any other
failure keeps the session so a signed-in device works through a provider outage (ADR 0206 decision 9). The flow needs
WebCrypto. No `SignInBrowser` driver ships here yet: the Expo and Electron ones come with their platform entries.

## Step-up, external providers, PINs, keys, guardians and verification

- **Step-up.** `requireAssurance(assuranceOf(claims, identity), AssuranceLevel.Aal2, identity, now)` refuses
  `step_up_required` when the level is lower or the authentication is older than `stepUpMaxAgeMinutes`; the client then
  calls `session.signIn(stepUpSignIn())`. Which actions need it is rule and settings data.
- **External providers.** A market pack lists its sign-in providers under `signInProvidersKey`; `externalProviders`
  maps each to its id at this deployment. `session.signIn(externalSignIn(key, identity))` sends the hosted sign-in
  straight there.
- **Staff PINs.** `StaffPinService.enrol`, `switchTo` and `override` keep a salted PBKDF2 hash per device and staff
  member (in the `secrets` area on the till), lock out after `pinMaxAttempts`, and check the manager's permission
  through the IAM decision point.
- **API keys.** `mintApiKey(ApiKeyKind.Publishable, identity)` makes a prefixed, checksummed key; the gateway calls
  `checkPublishableKey(key, origin, record.origins, identity)` before the lookup.
- **Guardians.** `GuardianActingService.actFor(actor, minor, { purpose, birthDate, ageOfMajority })` checks the link,
  its restrictions and the pack's age, and returns the delegated principal to record.
- **Verification.** `VerificationService.register(key, driver)` wires providers; `verify(request, resolved, on)` tries
  the providers the pack lists under `verificationPackKey` for the request's kind, in order.

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
const session = fakeSession({ status: SessionStatus.SignedIn, tenants: 2 });
const [first, second] = session.user.tenants;
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
