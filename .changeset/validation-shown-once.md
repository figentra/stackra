---
"@stackra/validation": minor
---

`@ShownOnce` marks an output field the caller sees once (a signing secret, a new API key). It records `true`, like
`@Hidden`, and the field still goes out in the first response; `ShownOnce.members(Class)` lists the marked fields.
