---
"@stackra/oxlint-config": minor
"@stackra/access-log": patch
"@stackra/actions": patch
"@stackra/ai": patch
"@stackra/analytics": patch
"@stackra/app": patch
"@stackra/brand-kit": patch
"@stackra/builder": patch
"@stackra/cache": patch
"@stackra/calendar": patch
"@stackra/cli": patch
"@stackra/clients": patch
"@stackra/collaboration": patch
"@stackra/container": patch
"@stackra/content": patch
"@stackra/contracts": patch
"@stackra/coordinator": patch
"@stackra/csp": patch
"@stackra/data-transfer": patch
"@stackra/database": patch
"@stackra/devtools-kit": patch
"@stackra/documents": patch
"@stackra/entitlements": patch
"@stackra/errors": patch
"@stackra/experience": patch
"@stackra/feature-flags": patch
"@stackra/filesystem": patch
"@stackra/fiscal": patch
"@stackra/gen": patch
"@stackra/i18n": patch
"@stackra/iam": patch
"@stackra/icons": patch
"@stackra/identity": patch
"@stackra/infra-aws": patch
"@stackra/infra-aws-runtime": patch
"@stackra/infra-cloudflare": patch
"@stackra/infra-gcp": patch
"@stackra/infra-github": patch
"@stackra/infra-identity": patch
"@stackra/infra-mobile": patch
"@stackra/infra-tools": patch
"@stackra/integrations": patch
"@stackra/licensing": patch
"@stackra/locking": patch
"@stackra/loyalty-kit": patch
"@stackra/market-packs": patch
"@stackra/mcp": patch
"@stackra/media": patch
"@stackra/model": patch
"@stackra/money": patch
"@stackra/navigation": patch
"@stackra/notifications": patch
"@stackra/outbox": patch
"@stackra/panel": patch
"@stackra/payments": patch
"@stackra/peripherals": patch
"@stackra/platform": patch
"@stackra/pricing": patch
"@stackra/query": patch
"@stackra/queue": patch
"@stackra/realtime": patch
"@stackra/registry": patch
"@stackra/renderers": patch
"@stackra/repo-checks": patch
"@stackra/runway": patch
"@stackra/sandbox": patch
"@stackra/scheduler": patch
"@stackra/scope": patch
"@stackra/search": patch
"@stackra/seo": patch
"@stackra/settings": patch
"@stackra/shipping": patch
"@stackra/shortcuts": patch
"@stackra/skills": patch
"@stackra/state": patch
"@stackra/storage": patch
"@stackra/support": patch
"@stackra/tenancy": patch
"@stackra/testing": patch
"@stackra/tokens": patch
"@stackra/transport": patch
"@stackra/ui": patch
"@stackra/validation": patch
"@stackra/versioning": patch
"@stackra/vite-plugin": patch
"@stackra/webhooks": patch
"@stackra/workflow": patch
---

Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
`no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.

The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
