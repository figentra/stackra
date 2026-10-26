---
"@stackra/gen": minor
---

Add the `public` manifest flag and the public SDKs (OS ADR 0039): an action or query with `public: true` is recorded
as `public` (refused without an endpoint, `public_without_endpoint`), and `emitSdks` writes TypeScript, Python and PHP
clients for the public entries into `.stackra/sdks/`.
