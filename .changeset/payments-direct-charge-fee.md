---
"@stackra/payments": minor
---

A direct-charge `applicationFee?: Money` on `CheckoutRequest`, `TokenCharge` and `CaptureRequest`: the platform's fee on
a charge made on the connected account (Stripe `application_fee_amount`), unlike `platform`, which is a destination
charge. `PaymentService.capture(reference, amount?, applicationFee?)` puts it on the capture request it builds, so a
partial capture carries the fee for what it takes. A fee in another currency, negative, above the amount, or beside a
`platform` share is refused (`ApplicationFeeInvalidError`). Whether a connection takes the fee is its gateway's call:
a Stripe connector sends it only for a connected account's direct charge.
