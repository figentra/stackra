---
"@stackra/container": patch
---

`Wiring.platform` accepts `Container`. Its constructor is private, so it was not an `AnyClass`, and the generated
`.stackra/entry/server.ts` of a service that injects the container (`platform: [Container]`) failed to typecheck
when it passed its wiring to `createApp`. Packages were unaffected because only a service passes `wiring` to a typed
parameter.
