---
"@stackra/csp": minor
---

`CspConfig.frameAncestors` lets a path be framed: an exact path or a `/*` prefix maps to `self` and https origins, or
to `"request"` for framers the runtime resolves per request and passes as `CspAdditions.frameAncestors` with
`CspAdditions.path`. Every framer must be exactly one origin; a wildcard is refused in configuration and in a
resolver's output alike. Every other path keeps `frame-ancestors 'none'` and `X-Frame-Options: DENY`;
`securityHeaders` now takes the same additions and drops `X-Frame-Options` only where a framer is allowed.
