# Plan: vault-keeper reads the runways through @stackra/runway (STA-1859)

1. Replace `import { plan, readRunways } from "./runway.mjs"` with imports of `readRunways` and `deployPlan` from
   `packages/developer/runway/src/node/functions/` (type-stripped source), and call `deployPlan` where `plan` was.
2. oxfmt and oxlint on the Mac; `vault-keeper.test.mjs` runs in CI (`pnpm validate`).
