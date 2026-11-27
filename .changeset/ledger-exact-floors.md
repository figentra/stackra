---
"@stackra/ledger": patch
---

`Journal` checks a balance floor exactly. `append` and `post` added the balance and the debit, or the account's net, as
JavaScript numbers, and `reverseWhere` kept its running balance as one, so beside amounts near
`Number.MAX_SAFE_INTEGER` a debit could cross a floor by a unit and a reversal could be cut short. These sums are now
BigInt. A floored write now throws a `RangeError` and writes nothing when its floor is not a safe integer, or when the
balance it is checked against is beyond the safe-integer range, where a `number` may already have rounded it; a write
with `floor: null` is unaffected.
