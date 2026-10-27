---
"@stackra/payments": minor
---

Pre-authorisation and partial payments (STA-1024, batch stackra-70). `PaymentCapability.PreAuth` (`pre_auth`) and
`IncrementalAuth` (`incremental_auth`) with the `PreAuthGateway` and `IncrementalAuthGateway` ports and
`IncrementRequest`; `PaymentService.preAuthorize` holds on a saved token and `increment` raises an authorised hold
(capture in part and `void` release are unchanged). `PaymentBalanceService` takes concurrent partial payments against
one balance: each part is reserved under the `PaymentBalances` lock, refused with `BalanceExceededError` when it does
not fit, and `settle` counts each paid part once. New port `PaymentBalances` with its memory driver; the gateway fake
pre-authorises and raises holds.
