---
"@stackra/database": minor
"@stackra/gen": patch
---

A seeder that injects its repositories or services now runs wherever seeders run. A seeder is not a binding, so the
container could not build one with its dependencies: `.seed()` and `stackra db seed` built it with no arguments and its
first repository call failed. `seederOf(container, type, deps)` (`@stackra/database/node`) builds a bound seeder from the
container, else the class with its constructor tokens resolved in the container. Gen lists those tokens in the seed
entry (`SeederEntry.deps`) and registers them in the test setup (`registerSeederDeps`, `@stackra/database/testing`).
