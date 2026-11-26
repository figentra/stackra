---
"@stackra/gen": minor
"@stackra/repo-checks": minor
"@stackra/flow-preset": patch
---

The five staged gen checks now refuse everywhere, as promised for 0.20: an action at L0 or L1 (`action_risk_below_write`,
ADR 0099), a query above L1 with no written reason (`query_above_l1`), an L3 or L4 user action with no `stepUp`
(`step_up_missing`, ADR 0406), a client write with no written `idempotency` (`idempotency_missing`, ADR 0136 decision 3)
and an owned model whose table no migration gives `t.belongsToTenant()` (`model_tenancy_migration_missing`, ADR 0239).
Each blocks the run and nothing is written; before, they printed as warnings unless `STACKRA_GEN_STRICT=1` was set, so an
app could ship tenant data without row ownership and still pass gen.

Breaking: `STACKRA_GEN_STRICT` is gone. `generate()` and `generateMember()` no longer take a `strict` option, and
`@stackra/repo-checks` drops `checkGenStrictEnv` and its `gen-strict-env` finding (there is no variable left for a turbo
task to pass). Remove `STACKRA_GEN_STRICT` from your `turbo.jsonc` task `env` lists and scripts; it does nothing now.
Before taking this version, run `stackra gen --check` with `STACKRA_GEN_STRICT=1` on your current version: whatever it
refuses is what this version refuses. The fix line of each refusal says what to write.

The generated `.stackra/tests/tenant-isolation.int.test.ts` no longer collects and prints `assertRowSecurity` warnings: the
audit fails on a gap itself (strict by default since the tenancy contract step). The Flow preset's gate runs
`pnpm gen:check` without the variable.
