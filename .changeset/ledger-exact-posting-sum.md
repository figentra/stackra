---
"@stackra/ledger": patch
---

`Journal.post` sums a posting's lines exactly. It summed them as JavaScript numbers, which round once a partial sum
passes 2^53, so a posting beside an amount near `Number.MAX_SAFE_INTEGER` could be written while off by a unit, or
refused while balanced. The lines are now summed in BigInt; `UnbalancedPostingError.total` still reports the sum as a
number.
