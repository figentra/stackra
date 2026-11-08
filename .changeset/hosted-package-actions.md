---
"@stackra/gen": patch
"@stackra/access-log": patch
"@stackra/achievements": patch
"@stackra/analytics": patch
"@stackra/collaboration": patch
"@stackra/consent": patch
"@stackra/data-maintenance": patch
"@stackra/devices": patch
"@stackra/identity": patch
"@stackra/loyalty-kit": patch
"@stackra/media": patch
"@stackra/privacy": patch
"@stackra/segments": patch
"@stackra/tenancy": patch
"@stackra/webhooks": patch
---

A host binds the actions and queries of each package module it hosts, as it does that package's services: they are
the module's surface, so a test or a client can call one by class (`run(EnrollMemberAction, …)`) without a host class
injecting it. A published package's manifest lists its actions and queries in `services` with their constructor
tokens, and the host wiring binds each one with them.
