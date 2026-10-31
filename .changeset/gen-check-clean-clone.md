---
"@stackra/gen": patch
---

`gen --check` passes on a clean clone: a generated file that is missing is drift only when the member commits it
(`stackra.manifest.json`, `openapi.json`), so gitignored `.stackra/` output and root shims no longer fail the check
before gen has run (STA-1742).
