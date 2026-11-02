---
"@stackra/runway": minor
---

The root runway's `targets` are typed: the nine destinations Runway knows (`encore-cloud`, `cloudflare-workers`,
`aws-ecs`, `compose`, `helm`, `eas`, `electron-release`, `mintlify`, `npm`) are closed objects with the keys the
repositories use, so a misspelt key such as `eas.ota.rolout` now fails `parseRunway` and the JSON Schema instead of
passing silently; a secret value in `mintlify.adminKey` (a NAME) fails too. Any other destination name stays open, and
each provider still parses its own settings. `schema/root.json` and the canonical `tools/schemas/runway-root.schema.json`
carry the same shape (STA-1975).
