---
"@stackra/vitest-config": patch
"@stackra/cli": patch
"@stackra/gen": patch
---

The contract test tier of ADR 0182 (STA-2837). `@stackra/vitest-config/contract` exports `contractTier` and
`CONTRACT_TESTS`, and the service and library presets leave `CONTRACT_TESTS` out of their unit, react and native
projects; gen writes `.stackra/vitest.contract.config.ts` for a member with a `.contract.test.ts`, and
`stackra test --tier contract` runs it (`turbo run test:contract` at the root). `stackra contract [--base <ref>]` runs
`oasdiff breaking` on every member's OpenAPI projection (a deleted member's every operation is a break) of its `stackra.manifest.json` against the merge base with
`origin/main`, inlining mounted packages' shapes, and fails on each error-level break that
`tools/contract/accepted-breaks.yaml` does not excuse. Install the binary with `mise install github:oasdiff/oasdiff@1.40.0`.
