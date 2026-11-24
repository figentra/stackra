---
"@stackra/repo-checks": patch
---

`MUST_STAY_JSON` names the benchmark harness's `framework.json`, `agent-script.json` and `settings.json`. The runner
under `benchmarks/` is plain Node with no dependency and reads them with `JSON.parse`: Node has no YAML parser, and a
`.jsonc` name would promise comments that `JSON.parse` rejects. Without the entry `stackra validate --repository` reported
all ten files as configs that should be YAML or JSONC.
