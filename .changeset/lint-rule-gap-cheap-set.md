---
"@stackra/oxlint-config": minor
"@stackra/access-log": patch
"@stackra/actions": patch
"@stackra/ai": patch
"@stackra/app": patch
"@stackra/builder": patch
"@stackra/cli": patch
"@stackra/clients": patch
"@stackra/collaboration": patch
"@stackra/consent": patch
"@stackra/container": patch
"@stackra/database": patch
"@stackra/devices": patch
"@stackra/documents": patch
"@stackra/entitlements": patch
"@stackra/fiscal": patch
"@stackra/gen": patch
"@stackra/iam": patch
"@stackra/identity": patch
"@stackra/infra-cloudflare": patch
"@stackra/infra-github": patch
"@stackra/infra-identity": patch
"@stackra/integrations": patch
"@stackra/logger": patch
"@stackra/loyalty-kit": patch
"@stackra/money": patch
"@stackra/navigation": patch
"@stackra/notifications": patch
"@stackra/panel": patch
"@stackra/payments": patch
"@stackra/peripherals": patch
"@stackra/platform": patch
"@stackra/pricing": patch
"@stackra/privacy": patch
"@stackra/query": patch
"@stackra/queue": patch
"@stackra/realtime": patch
"@stackra/repo-checks": patch
"@stackra/rules": patch
"@stackra/runway": patch
"@stackra/scheduler": patch
"@stackra/search": patch
"@stackra/settings": patch
"@stackra/shortcuts": patch
"@stackra/state": patch
"@stackra/support": patch
"@stackra/tenancy": patch
"@stackra/testing": patch
"@stackra/theming": patch
"@stackra/tokens": patch
"@stackra/transport": patch
"@stackra/ui": patch
"@stackra/validation": patch
"@stackra/vite-plugin": patch
"@stackra/workflow": patch
---

Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
block kind instead of emitting nothing for it.
