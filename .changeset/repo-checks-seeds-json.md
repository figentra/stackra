---
"@stackra/repo-checks": patch
---

`stackra validate` no longer asks to convert seed data under `assets/seeds/**/*.json` to YAML: the seeders read it as
JSON, so it joins `MUST_STAY_JSON`.
