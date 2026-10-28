---
"@stackra/oxlint-config": minor
"@stackra/access-log": patch
"@stackra/achievements": patch
"@stackra/actions": patch
"@stackra/ai": patch
"@stackra/builder": patch
"@stackra/cache": patch
"@stackra/calendar": patch
"@stackra/cli": patch
"@stackra/clients": patch
"@stackra/coding-standard": patch
"@stackra/config": patch
"@stackra/container": patch
"@stackra/content": patch
"@stackra/contracts": patch
"@stackra/csp": patch
"@stackra/data-transfer": patch
"@stackra/database": patch
"@stackra/devices": patch
"@stackra/documents": patch
"@stackra/errors": patch
"@stackra/experience": patch
"@stackra/filesystem": patch
"@stackra/fiscal": patch
"@stackra/gen": patch
"@stackra/i18n": patch
"@stackra/iam": patch
"@stackra/identity": patch
"@stackra/infra-aws": patch
"@stackra/infra-aws-runtime": patch
"@stackra/infra-gcp": patch
"@stackra/infra-github": patch
"@stackra/infra-observability": patch
"@stackra/integrations": patch
"@stackra/licensing": patch
"@stackra/locking": patch
"@stackra/logger": patch
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
"@stackra/pricing": patch
"@stackra/privacy": patch
"@stackra/query": patch
"@stackra/queue": patch
"@stackra/realtime": patch
"@stackra/registry": patch
"@stackra/renderers": patch
"@stackra/repo-checks": patch
"@stackra/rules": patch
"@stackra/runway": patch
"@stackra/scheduler": patch
"@stackra/scope": patch
"@stackra/seo": patch
"@stackra/settings": patch
"@stackra/shipping": patch
"@stackra/skills": patch
"@stackra/support": patch
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

Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
`unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
`unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
prints them lowercase, so the two would fight.

The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
