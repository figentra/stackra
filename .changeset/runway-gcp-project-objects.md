---
"@stackra/runway": patch
---

The root runway accepts a `providers.gcp.projects` entry as an object such as `{ id, number }` as well as a plain
value or `ref:`, so a root runway can carry the project shape `@stackra/infra-gcp` checks (ADR 0401). The shipped
`schema/root.json` carries the same change; copy it to `tools/schemas/runway-root.schema.json`.
