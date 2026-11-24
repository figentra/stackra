---
"@stackra/ledger": patch
---

The journal no longer lets a sum round past 2^53. `post` decided that a posting balances with a running `number` sum, which
rounds once partial sums leave the safe integers: lines of 9 007 199 254 740 991, 2, -9 007 199 254 740 991 and -1 (each a
safe integer, true total 1) summed to 0 and were accepted as balanced, and lines that do balance could be refused. The
total is now computed in exact integer arithmetic. `balance` returned the database's sum converted with `Number`, so a
balance beyond 2^53 came back silently rounded; it now throws a `RangeError`, as `Money` does, and the floor checks of
`append` and `reverse` add a balance and an amount with a checked add that refuses a result outside the safe integers.
Nothing changes for any amount a ledger can hold exactly.
