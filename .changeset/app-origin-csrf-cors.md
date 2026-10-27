---
"@stackra/app": minor
---

Add the origin and CSRF guards and the CORS configuration for the BFF cookie session (gap analysis P0, STA-1374):
`OriginGuard` (order -90) lets a state-changing request through only from the API's own origin or
`CorsConfig.allowedOrigins`, refusing a cookie with no origin (`OriginNotAllowedError`, 403); `CsrfGuard` (order -80)
needs `CsrfConfig.headerName` on a cookie-authenticated state change, and the token cookie's value in double-submit
mode (`CsrfTokenInvalidError`, 403); `corsHeaders` answers preflights and responses from `CorsConfig` (origins,
methods, headers, credentials, max-age). Every value is a setting (`app.cors`, `app.csrf`). New dependencies:
`@stackra/validation`, `zod`.
