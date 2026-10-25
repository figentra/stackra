---
"@stackra/runway": minor
---

Add the cloud and region dimensions of ADR 0354 to the root runway: a top-level `regions` map (each with its `cloud`,
`aws` or `gcp`, cloud `location`, `account` and `jurisdiction`), `providers.gcp`, and an environment's `regions` in
release order; `RunwayCloud`, `checkRegions` and `regionsOf`. The shipped `schema/root.json` carries the same change;
copy it to `tools/schemas/runway-root.schema.json`.
