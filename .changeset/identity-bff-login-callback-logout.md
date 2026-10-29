---
"@stackra/identity": minor
---

Serve the BFF's sign-in from `./node`: `BffService` answers `GET login` (OIDC authorization code with PKCE, state,
nonce and verifier sealed in a short-lived `__Host-` cookie), `GET callback` (state, code exchange and ID token checks,
then the `HttpOnly; Secure; SameSite=Lax; Path=/` session cookie), `GET session` and `POST logout`, which ends the
provider session server-side through `IdpAdmin.endSession`, clears the cookie and answers the provider's end-session
URL. Return URLs are limited to `BffConfig.returnOrigins`. New `BffConfig` (key `bff`, with `BffOptions` and
`BffConfig$`) holding the callback URL, return origins, cookie name and lifetimes, and the `IDENTITY_BFF_CLIENT_SECRET`
and `IDENTITY_BFF_COOKIE_KEY` secrets by name (STA-1566). `BffService.sessionOf(request)` reads the session cookie for a
host's raw endpoint that turns it into the call's actor, and `BffSessionStoreDriver.signOut` now leaves for the
`redirectTo` the logout answers, so the provider's browser session ends too.
