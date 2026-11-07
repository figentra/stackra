---
"@stackra/repo-checks": patch
---

The neutral and stackra layouts allow a root `STATE.md` and `llms.txt`, which every repository now keeps (the repo's
current state and its agent index), so `stackra validate` stops reporting them.
