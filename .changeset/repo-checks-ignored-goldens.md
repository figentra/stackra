---
"@stackra/repo-checks": patch
---

The config phase refuses a file under a `__golden__` folder that git would ignore (`checkIgnoredGoldens`), so a golden can no longer go uncommitted.
