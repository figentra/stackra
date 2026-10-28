---
"@stackra/outbox": minor
"@stackra/versioning": minor
---

Event `Change`s now run on delivery. `@stackra/versioning` adds `publishedVersions(subject, on)`, the older versions
of an integration event still published before each change's sunset. The `@stackra/outbox` relay publishes an event at
its current version and then at each of those versions (`<base>.v<from>`, data through `down`) under the same id; the
inbox lifts an older version with `up` to the class this process has and leaves a newer one unclaimed, so listeners
run once per id.
