# Threat model: @stackra/identity

<!--
Stackra file contract:
Purpose: the threat model of @stackra/identity: sign-in through the hosted provider (BFF cookie session and PKCE),
         the session on each client, step-up, API keys, passkeys, app approval, staff PINs, sessions and account
         deletion, operator bootstrap, the login directory and the provider's auth events.
Boundary: documentation only; the code wins on any difference. A change that adds an asset, a trust boundary or an
          external call updates this file in the same pull request (constitution SEC10).
Runtime: none
Governing contract: constitution SEC1, SEC8 and SEC10; ADR 0206; ADR 0207 (and its amendment of 2026-11-26: the ASVS
                    level); ADR 0268; ADR 0278; ADR 0338; ADR 0451; STA-1579; STA-1580; STA-1586; STA-316.
-->

ASVS level: L2 for V2 (authentication) and V3 (session management); L1 for every other chapter (ADR 0207, amendment of 2026-11-26).
Reviewed: 2026-11-26 (STA-316).

ZITADEL authenticates people; this package is the provider-neutral client around it. It builds no login UI. Its
threats are account takeover, session theft, a stale or forged session, and a credential that outlives its owner.

## Assets

| Asset                                                   | Where it lives                                                                                | Class    |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------- |
| BFF session and flow cookies                            | the browser: `__Host-`, `HttpOnly`, `Secure`, `SameSite=Lax`, AES-GCM sealed                  | `secret` |
| Access and refresh tokens (PKCE clients)                | the device's `secrets` storage area                                                           | `secret` |
| BFF client secret and cookie key                        | `IDENTITY_BFF_CLIENT_SECRET`, `IDENTITY_BFF_COOKIE_KEY`, read blind                           | `secret` |
| API keys                                                | shown once to the owner; the store keeps `hashApiKey(key)` only                               | `secret` |
| Staff PINs                                              | salted PBKDF2 hash per device and staff member, in the `secrets` area                         | `secret` |
| Provider admin token, events signing key, directory key | `IDENTITY_IDP_ADMIN_TOKEN`, `IDENTITY_IDP_EVENTS_SIGNING_KEY`, `IDENTITY_LOGIN_DIRECTORY_KEY` | `secret` |
| Session user: name, email, picture                      | `SessionUser`, shown to its owner only                                                        | `pii`    |
| Login directory entries                                 | keyed HMAC-SHA-256 of a normalised email or phone, no plain identifier                        | `pii`    |

## Trust boundaries

1. The browser to the BFF routes (`login`, `callback`, `session`, `logout`).
2. The BFF and devices to ZITADEL: authorization code with PKCE, the token endpoint, end-session.
3. ZITADEL's Actions v2 webhook to `ZitadelAuthEventsService`.
4. A gateway calling `ApiKeyVerifierService` with a presented key.
5. The identity service to ZITADEL's admin API (`IdpAdmin`).
6. A region to the global login directory through the edge Worker.

## Threats and controls

| Threat                                                      | Control today                                                                                                                                                          | Open work                                                                                          |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Tokens stolen from the browser by script                    | The BFF keeps no token in JavaScript; the session cookie holds the user and provider `sid` only, sealed and `HttpOnly`                                                 | —                                                                                                  |
| Authorization-code interception or login CSRF               | State, nonce and the PKCE verifier sealed in the flow cookie; the callback checks state, issuer, audience, expiry, nonce and `sid`                                     | —                                                                                                  |
| Open redirect after sign-in                                 | `returnTo` must be an in-app path or a URL on a `returnOrigins` origin; anything else is 400                                                                           | —                                                                                                  |
| Cross-site sign-out or state change on the cookie session   | `logout` needs the CSRF header; `CsrfGuard` in `@stackra/app` requires it on every cookie-bearing write                                                                | —                                                                                                  |
| Password guessing and credential stuffing                   | ZITADEL: 12-character minimum and lockout after five failed password checks (`@stackra/infra-identity`); failures and lockouts enter the audit chain                   | The breached-password check of ADR 0207 decision 3; an OTP attempt limit (provider 0.2.0 has none) |
| An administrator signs in with a password alone             | The staff (operator) organisation forces a second factor (`@stackra/infra-identity`); for tenant administrators MFA is a provider setting no action sets or audits     | Per-tenant MFA enforcement as an audited admin action, STA-2817                                    |
| A destructive action runs on an old session                 | `requireAssurance` refuses `step_up_required` below AAL2 or older than `stepUpMaxAgeMinutes`; L3 and L4 actions declare `stepUp`                                       | Gen's `step_up_missing` made blocking, STA-2808                                                    |
| A revoked device keeps working offline                      | `invalid_grant` turns the session `revoked`; `OfflineLock` wipes the outbox, cache and secrets; the offline limit (24 h) wipes and signs out                           | —                                                                                                  |
| An API key is leaked, guessed or replayed from another site | Prefixed, checksummed keys; only the hash is stored; malformed keys refused before lookup; revocation, expiry and origin checked                                       | —                                                                                                  |
| App-approval push fatigue or a remote approval              | A number to match among decoys, enrolled devices only, one pending challenge per device, request limits per device and target; unknown accounts get a lookalike ticket | —                                                                                                  |
| A forged provider auth event                                | `ZITADEL-Signature` HMAC over timestamp and raw body, five minutes' tolerance, verified before parsing                                                                 | —                                                                                                  |
| An identifier enumerable from the global login directory    | Only keyed HMACs leave the region; the key is a secret per key id                                                                                                      | —                                                                                                  |
| Anyone grants themselves the first operator                 | `identity.operator.bootstrap` is L4 and system-held: only the environment's bootstrap service account passes                                                           | —                                                                                                  |
| A deleted or erased person can still sign in                | `EndErasedSubjectSessionsListener` ends every provider session and removes the provider user                                                                           | —                                                                                                  |
| A staff PIN is brute-forced on a shared till                | Salted PBKDF2, lockout after `pinMaxAttempts`, the manager override checked through IAM                                                                                | —                                                                                                  |
