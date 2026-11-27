---
"@stackra/cli": minor
---

`stackra db migrate` takes `--release <id>`, the release the run applies (the deploy's version or commit), and passes it to the member's `@stackra/database` runner, whose contract-step release gates compare it; without it the command names `STACKRA_RELEASE`, else the commit the member's checkout is at (`git rev-parse HEAD`, the commit `stackra deploy` ships), so a deploy that runs it in its checkout passes a release by default (STA-1406, ADR 0159 decision 3). The `DatabaseRunner` type's `migrate` options gain `release?`. Operators: pass `--release <version or commit>` (or set `STACKRA_RELEASE`) in your release step when it runs outside a git checkout; the default `stackra db migrate` in a deploy's checkout does this for you.
