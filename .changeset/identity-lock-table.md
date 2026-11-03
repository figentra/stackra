---
"@stackra/gen": patch
"@stackra/validation": patch
---

`stackra gen --check` locks permissions, roles, config keys, schema names, endpoints and reports (`identity_changed` unless `@Renamed` names the old identity), and accepts an integration event version bump; `@Renamed` may mark a report class.
