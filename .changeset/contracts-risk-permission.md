---
"@stackra/contracts": minor
---

Add `Risk` (the L0 to L4 scale) and `Permission` (`Permission.L0` to `L4`, `.system()`, `.restricted()`), moved from
`@stackra/iam` (STA-1890, ADR 0513). Both stay dependency-free, so `@stackra/contracts` is still a leaf.
