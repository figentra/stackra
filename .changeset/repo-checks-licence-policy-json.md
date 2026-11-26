---
"@stackra/repo-checks": patch
---

`tools/policy/licences.json` may stay JSON: the `stackra/verify` licence check reads that policy with `JSON.parse` inside the verify container, where only node runs, so `checkJsonConfigs` no longer asks for it to become YAML or JSONC.
