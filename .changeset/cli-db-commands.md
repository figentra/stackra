---
"@stackra/cli": minor
---

Add `stackra db migrate` (applies the member's pending migrations in order, the release step) and `stackra db rollback`
(reverts the last batch; refused unless the target is a dev, preview or test database). Both run in the member's context
through its own `@stackra/database/node`, imported dynamically, so the CLI does not bundle MikroORM.
