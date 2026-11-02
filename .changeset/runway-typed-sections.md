---
"@stackra/runway": minor
---

The root runway's `edge`, `release`, `observability` and `providers.github` blocks are closed objects: a misspelt key
or an out-of-range value now fails `parseRunway("root", …)` with its path instead of passing silently. Each mirrors
its owner's keys and value rules (infra-cloudflare, infra-observability, infra-github) without defaults, and the
owners still parse their own block. Both copies of the root JSON Schema carry the same shape.
