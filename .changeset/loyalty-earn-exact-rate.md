---
"@stackra/loyalty-kit": patch
---

`LoyaltyService.quoteEarn` credits the exact number of points. It was `Math.floor(amountMinor * earnPerMinor)` in binary
floating point, and the `earnPerMinor` setting is a decimal a merchant types, so a rate of 0.29 on 100 minor units gave
28.999999999999996 and earned 28 points instead of 29. Of the hundred rates of two decimals, ten misrounded for some
amounts (12 080 wrong results over the amounts 1 to 200 000), and 109 of the thousand rates of three decimals did. The
product is now formed in integers from the rate's shortest decimal text and floored there (`earnPoints`); an amount that is
not a safe integer, a rate that is negative or not finite, and a result beyond the safe integers are refused with a
`RangeError` instead of rounded. Nothing changes for rates that were already exact (0.01, 0.1, 0.5, 1).
