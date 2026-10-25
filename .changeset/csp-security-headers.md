---
"@stackra/csp": minor
---

Add `securityHeaders`, on by default: HSTS (two years, subdomains), `X-Content-Type-Options: nosniff`, a strict
`Referrer-Policy`, a `Permissions-Policy` that turns powerful features off, `Cross-Origin-Opener-Policy: same-origin`
and `X-Frame-Options: DENY`. `CspConfig` gains `hstsMaxAgeSeconds`, `hstsIncludeSubDomains`, `hstsPreload`,
`referrerPolicy` and `permissionsAllow`; the schema refuses values that would loosen the baseline.
