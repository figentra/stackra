---
"@stackra/repo-checks": patch
---

`stackra validate --repository` accepts `tools/release/registry-actions.json` as strict JSON (`MUST_STAY_JSON`): the
release workflow's registry maintenance (STA-2863) reads it with `JSON.parse` in a script that has no dependencies and
runs before any install, so the file can hold neither YAML nor comments.
