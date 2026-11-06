---
"@stackra/gen": patch
"@stackra/validation": patch
---

Fixes from the os 0.14 typecheck. Gen reads a trait's enum, `Translated`, list and prefix-less `PublicId` fields by
their types instead of `json()`. A declared contract package wins over a same-named sibling service folder. A hatch
import named like an `X$` the schema file declares comes in aliased. In validation, `Fields`/`InputFields` stop
recursing on `Json`, drop every `~` brand key (a config's `~kind` and `~config`), and `Same` compares readonly arrays
at any list-view depth.
