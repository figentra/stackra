---
"@stackra/payments": minor
---

`PaymentService` runs one call at a time on one payment. `refund`, `capture`, `void`, `increment`, `reconcile`,
`cancelTerminal` and `resolve` each read the record, check it, call the provider and save it, and nothing held the payment
between the read and the save. Two refunds of one payment at the same moment both passed the check against what was
taken (two refunds of 6 000 on a payment of 10 000 both reached the provider), and the later save overwrote the earlier
one (refunds of 3 000 and 2 000 left the record at 2 000; refunds of 4 000 and 6 000 left it at 6 000, not refunded, so a
further 4 000 refund was allowed). Each of those methods now holds a named lock from `@stackra/locking` over the whole
step, keyed `payments.payment:<connectionId>:<reference>` (the connection is the tenant's own public id, so identical
references of two tenants never wait on each other), and reads the record again under it. A caller that waits longer than
ten seconds gets `lock_unavailable` (503, retryable) and nothing changed.

Breaking for code that builds the service by hand: the constructor takes a `Locks` after `limits` and before the optional
`agents`; a host wired by gen gets it from the container, and tests use `paymentLocksOf(clock)` from `@stackra/payments/testing`.
`@stackra/locking` is a new dependency of the package.
