---
"@stackra/actions": minor
---

The idempotency step reads its retention window from a bound `IdempotencyRetentionSource` (`@stackra/contracts`), so an
operator shortens it without a deploy. The answer only shortens the window: it never passes the 24 hours of ADR 0136,
an action's own shorter `idempotencyTtl` still wins, and a failed read fails the call. With no source bound the window
stays 24 hours.
