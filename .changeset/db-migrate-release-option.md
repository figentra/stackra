---
"@stackra/cli": minor
---

`stackra db migrate` takes `--release <id>`, the release the run applies (the deploy's version or commit), and passes it to the member's `@stackra/database` runner, whose contract-step release gates compare it; without it the runner reads `STACKRA_RELEASE` as before (STA-1406, ADR 0159 decision 3). The `DatabaseRunner` type's `migrate` options gain `release?`.
