---
"@stackra/oxlint-config": minor
"@stackra/access-log": patch
"@stackra/actions": patch
"@stackra/ai": patch
"@stackra/app": patch
"@stackra/builder": patch
"@stackra/cache": patch
"@stackra/clients": patch
"@stackra/coding-standard": patch
"@stackra/collaboration": patch
"@stackra/config": patch
"@stackra/container": patch
"@stackra/contracts": patch
"@stackra/coordinator": patch
"@stackra/data-transfer": patch
"@stackra/database": patch
"@stackra/devtools-kit": patch
"@stackra/errors": patch
"@stackra/events": patch
"@stackra/experience": patch
"@stackra/feature-flags": patch
"@stackra/gen": patch
"@stackra/iam": patch
"@stackra/infra-aws": patch
"@stackra/infra-cloudflare": patch
"@stackra/infra-gcp": patch
"@stackra/integrations": patch
"@stackra/loyalty-kit": patch
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
"@stackra/runway": patch
"@stackra/search": patch
"@stackra/segments": patch
"@stackra/seo": patch
"@stackra/settings": patch
"@stackra/shipping": patch
"@stackra/shortcuts": patch
"@stackra/state": patch
"@stackra/storage": patch
"@stackra/support": patch
"@stackra/tenancy": patch
"@stackra/testing": patch
"@stackra/ui": patch
"@stackra/webhooks": patch
"@stackra/workflow": patch
---

Lint: rule-gap B-4 (stackra-232, owner D11). `@stackra/oxlint-config` turns on
`typescript/method-signature-style` with `"property"` at `error`. A method signature in an interface or type literal is
checked bivariantly even under `strictFunctionTypes`, so a driver could accept a narrower argument than its port
promises. Every port, type and augmentation in the packages listed now spells its members as properties
(`find: (id: string) => Promise<T>`), which TypeScript checks strictly.

No runtime change. The type surface is stricter: an implementation, fake or object literal whose parameter is narrower
than the port's now fails to typecheck, as it always should have. Module augmentations (`Matchers<R>`, `Blueprint`,
`TestingModuleBuilder`, `TestingApp`) use the same property form.
