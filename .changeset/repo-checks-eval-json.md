---
"@stackra/repo-checks": patch
---

`stackra validate --repository` no longer asks a prompt's evaluation dataset to become `.jsonc`. `@stackra/ai` binds a
code prompt's evaluations by the fixed asset name `<module>::ai/<stem>.eval.json`, so `assets/ai/**/<stem>.eval.json`
joins `MUST_STAY_JSON`; any other JSON under `assets/ai/` is still flagged.
