---
"@stackra/gen": minor
---

Every `registerActions` row now carries its output class, so the action pipeline can leave `@ShownOnce` fields out of
the idempotency store. The new warning `secret_output_kept` names an action that is not `Idempotency.Never` and returns a
secret-named output field (`signingSecret`, `apiKey`, `accessToken`) with neither `@ShownOnce` nor `@Hidden`.
