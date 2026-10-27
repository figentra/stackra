---
"@stackra/gen": patch
---

Golden snapshot tests (STA-1320): `__golden__/` holds fixture workspaces for a service, a package with drivers, an app
with clients, a docs app, a consumer of another service's manifest, package lang and eight whole-run refusals;
`src/node/__tests__/golden.test.ts` runs gen over them and diffs the written files and refusals against the committed
expected output (`UPDATE_GOLDEN=1` refreshes it). Tests only; gen's behaviour is unchanged.
