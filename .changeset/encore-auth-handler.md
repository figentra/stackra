---
"@stackra/app": minor
"@stackra/gen": minor
---

One generated Encore auth handler for user and service calls (ADR 0209, amendment of 2026-11-07, point 5).
`@stackra/app/server` adds `CallAuthenticator`: it reads `Authorization: Bearer`, verifies the token with
`verifyBearerToken` under `BearerConfig` and the bound `JsonWebKeys`, and maps it to its actor with
`@stackra/identity`'s `actorOf`, answering `{ userID, actor }` (`CallAuthData`). Every failure is one
`BearerTokenInvalidError`, with no detail and never the token; a `Stackra-On-Behalf-Of` header is refused until the
forwarded user token is verified. For a service with endpoints, `@stackra/gen` now writes
`.stackra/encore/<member>/auth.ts`: the app's one `authHandler` over those two headers, which runs `CallAuthenticator`
and answers `APIError.unauthenticated` on its refusal, and the app's one `Gateway`.
