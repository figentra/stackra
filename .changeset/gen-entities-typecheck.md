---
"@stackra/gen": patch
"@stackra/typescript-config": patch
---

A service's generated entity schema lists the `"~defaults"` marker the schemas file adds as a non-persisted property,
which `EntitySchema<T>` requires (TS2741 in `.stackra/gen/entities`); a package's committed entity list does not, since
its model type has no such key. The `service` preset turns `declaration` off (a service publishes no `.d.ts`, and the
entity schema types name `EntityCtor` from @mikro-orm/core, which a service cannot name: TS2883), and is tested to keep
`.stackra/encore` out of the typecheck (STA-1894, STA-1880).
