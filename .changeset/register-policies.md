---
"@stackra/gen": minor
---

Gen records each record `Policy<Model>` in a manifest `policies` section (class, model, module, file and the model's
`modelFile`, own then hosted with `from`, written only when there is one), writes `registerPolicies([...])` in
`#stackra/registrations` from it, and a service's boot calls `connectPolicies(container)`. Until now nothing paired a
model with its policy, so `ctx.authorize(record)` ran no policy and a caller holding a permission could act on another
principal's record, such as another customer's loyalty account (STA-2045).
