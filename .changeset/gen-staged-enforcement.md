---
"@stackra/gen": minor
---

The write floor and the call-shape checks are staged. `action_risk_below_write`, `idempotency_missing`,
`query_above_l1` and `step_up_missing` print as warnings in 0.19 and gen still writes; with `STACKRA_GEN_STRICT=1`
they refuse, as they will everywhere from 0.20. Fix them in each product before 0.20.
