---
"@stackra/panel": minor
---

Add shell slot contracts (ADR 0438): `defineSlot<Props>({ key, surface, cardinality })` declares a typed slot in a
shell package and `fillSlot(slot, component, { surface })` fills it from a product's UI package, with the `Slot`,
`SlotFill`, `SlotOptions`, `SlotCardinality` and `SlotComponent` types.
