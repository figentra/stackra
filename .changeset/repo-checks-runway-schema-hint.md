---
"@stackra/repo-checks": patch
---

The runway schema copy check now says to put the zod-derived text in the canonical `tools/schemas` file and copy it
to runway's `schema/`, instead of only `cp`, which overwrote a correct copy with a stale canonical file.
