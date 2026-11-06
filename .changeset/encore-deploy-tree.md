---
"@stackra/runway": patch
---

The `encore-cloud` provider pushes a deploy commit Encore can build. The generated app is gitignored, so apply now
commits, on top of the source commit and in a temporary checkout, the service member's generated outputs, the
workspace packages' build outputs, the member's `encore.app` (the member folder becomes the Encore app root) and a
`tsconfig.json` whose `paths` mirror the member's `imports`, then force-pushes that commit to the environment's
branch. Verify and rollback follow the pushed commit. A repository with no generated app pushes the source commit as
before; one with two service apps is refused until they share one app root.
