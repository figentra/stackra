---
"@stackra/gen": minor
---

Read model additions (ADR 0336, stackra-64). A `ModelAddition(Base)` class in `models/<base>.model-addition.ts` is the
`model_addition` kind (`<Base>Addition`); its fields are a shape. The manifest gains an `additions` section (base model
key from the base's released manifest, side table `<module>.<addition>s`, wire key, fields) through `additionsOf`, with
the refusals `addition_base_source`, `addition_target_missing` and `addition_key_collision`. The module's entity file
writes a side-table `EntitySchema` per addition, keyed by the base record's id.
