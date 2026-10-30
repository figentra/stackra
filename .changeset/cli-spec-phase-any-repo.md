---
"@stackra/cli": minor
---

The `spec` phase of `stackra check` runs the spec checks of `@stackra/repo-checks` in any repository that has
`.agents/specs` (STA-1669), instead of calling `tools/scripts/spec-gate.mjs` and `spec-trace.mjs`, so product repositories
check their specs too. A repository without `.agents/specs` reports the phase as skipped (no specs). `--base`,
`STACKRA_BRANCH` and `SPEC_GATE_REQUIRE_READY=1` work as before.
