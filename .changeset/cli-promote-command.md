---
"@stackra/cli": minor
---

Add `stackra promote --to <environment> [--from <environment>] [--sha <sha>] [--dry-run] [--approved]`, which ships what one environment runs to the next through runway's `promote()`, with the same approval check and deploy lock as `stackra deploy --env`.
