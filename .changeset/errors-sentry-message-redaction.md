---
"@stackra/errors": patch
---

Mask secret shapes in the error message `sentryEnvelope` sends (STA-1588): the message passes `@stackra/logger`'s
`redact` first, so a bearer token, JWT, API key or URL credentials in it never reach Sentry. `@stackra/errors` now
depends on `@stackra/logger` (no cycle: the logger depends on neither this package nor anything that does).
