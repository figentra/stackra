---
"@stackra/cli": patch
"@stackra/infra-testbed": patch
---

`stackra testbed run` no longer uploads a worktree's `.cache` (its pnpm store, about 7.5 GB); the box agent's seed
refresh leaves it out too.
