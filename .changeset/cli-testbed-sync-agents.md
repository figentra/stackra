---
"@stackra/cli": patch
---

`stackra testbed run` uploads `.agents` with the project, since `pnpm validate` reads its specs, hooks, rules and
skills; `.git` is left out (the box makes its own snapshot), as `ci-box` did.
