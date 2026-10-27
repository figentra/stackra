---
"@stackra/gen": minor
---

Read exported `defineSlot` and `fillSlot` calls, list them in the manifest (`slots`, `fills`) for the OS registry, and
refuse a fill that breaks its slot's contract: `slot_undeclared`, `slot_surface_mismatch`, `slot_props_mismatch`,
`slot_fill_duplicate`, `slot_key_duplicate` and `slot_options_not_constant` (ADR 0438).
