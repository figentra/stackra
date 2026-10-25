---
"@stackra/identity": minor
---

Add `@stackra/identity`: `IdentityConfig` with its shipped schema, `AuthFlow` and `SessionStatus`, the `SessionStore`
port with the BFF cookie and PKCE drivers, `SessionService` with the session claims mapping (the scope claim is
`@stackra/scope`'s `SCOPE_PATH_CLAIM`), which also keeps `@stackra/iam`'s permission snapshot, the `ClientSession` and
memory `IdentityResolver` drivers, the `OfflineSession` driver through which a revoked session wipes and locks the
offline stores of `@stackra/query`, `useSession` in `./react`, and `fakeSession` and `fakeIdentity` in `./testing`.
