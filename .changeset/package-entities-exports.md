---
"@stackra/cli": patch
"@stackra/achievements": patch
"@stackra/ai": patch
"@stackra/rules": patch
"@stackra/segments": patch
"@stackra/loyalty-kit": patch
"@stackra/webhooks": patch
"@stackra/content": patch
"@stackra/collaboration": patch
"@stackra/panel": patch
"@stackra/workflow": patch
"@stackra/access-log": patch
"@stackra/scope": patch
"@stackra/settings": patch
---

Each package with models of its own exports `<MEMBER>_ENTITIES` from `./node`, which a hosting service's generated
`registrations.ts` imports to register the package's entities; without it the service failed with TS2305 (STA-1793). `stackra validate --repository` refuses a package with own
models whose stand-in `./node` barrel misses it.
