---
"@stackra/cli": patch
---

`stackra testbed run` uploads `.agents` with the project, since `pnpm validate` reads its specs, hooks, rules and
skills; only the old `ci-box` list is excluded now.
