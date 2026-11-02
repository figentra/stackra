---
"@stackra/gen": patch
"@stackra/typescript-config": patch
---

A generated entity schema is annotated `EntitySchema<Model>`, so a declaration build never names MikroORM's inferred
type (TS2883), and a model with a defaulted field lists the `"~defaults"` marker the schemas file adds as a non-persisted
property, which `EntitySchema<T>` requires (TS2741 in `.stackra/gen/entities`). The `service` preset is tested to keep
`.stackra/encore` out of the typecheck (STA-1894, STA-1880).
