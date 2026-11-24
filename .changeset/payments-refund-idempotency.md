---
"@stackra/payments": minor
---

`PaymentService.refund` is idempotent on its `refundReference`. The reference reached the provider as its idempotency key,
but the payment's own record added `amount` to `refunded` on every call and remembered no reference, so a client retry of a
refund the provider had already accepted (and deduplicated) was counted twice: refunding 3 000 under "r1" twice left the
record at 6 000, which refused later legitimate refunds early and could mark a payment `refunded` with half the money
returned; and a retry of the refund that had used the payment up threw `InvalidPaymentTransitionError` instead of returning
the first answer. The record now keeps the refunds the provider accepted (`PaymentRecord.refunds`, a `PaymentRefund` per
reference, in a new nullable jsonb column added by migration `0003_add_refunds_to_payment_records`), and `refund` answers a
repeat of the same reference and amount with its first answer and changes nothing. The same reference with another amount
or currency is refused with `RefundReferenceReusedError` (`refund_reference_reused`, 409). A refund the provider failed is not
remembered, so its reference can be sent again. Older records have no `refunds` and behave as before. This builds on the
per-payment lock of the previous change, which makes two copies of one refund at the same moment a repeat.
