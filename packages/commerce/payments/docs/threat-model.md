# Threat model: @stackra/payments

<!--
Stackra file contract:
Purpose: the threat model of @stackra/payments: the gateway ports, `PaymentService` and its unknown state, saved-token
         and merchant-initiated charges, partial payments, agent checkout, SoftPos and ECR terminals, payouts and
         connected-account limits.
Boundary: documentation only; the code wins on any difference. A change that adds an asset, a trust boundary or an
          external call updates this file in the same pull request (constitution SEC10).
Runtime: none
Governing contract: constitution SEC10; ADR 0357; ADR 0356; ADR 0443; ADR 0445; ADR 0446; ADR 0207 (amendment of
                    2026-11-26: the ASVS level); STA-316.
-->

ASVS level: L1 for every chapter; V11 (business logic) is this package's own (ADR 0207, amendment of 2026-11-26).
Reviewed: 2026-11-26 (STA-316).

The engine moves money through providers' gateways; the vendor drivers live in the OS integrations service, and no
card number ever passes through Stackra. Its threats are paying twice, paying the wrong amount or party, an agent paying
alone, and a provider's answer that never arrives.

## Assets

| Asset                                   | Where it lives                                                     | Class          |
| --------------------------------------- | ------------------------------------------------------------------ | -------------- |
| Payment records and their status        | `payments.payment_records`, one per merchant reference, per tenant | `confidential` |
| Saved provider tokens                   | `SavedMethod.token` (a provider token, never a card number)        | `secret`       |
| Provider secret keys                    | Connection `@Secret` fields, read by the connector only            | `secret`       |
| Customer name, email, phone, address    | request bodies to the serving provider only                        | `pii`          |
| SoftPos client secret                   | handed to the collecting phone, never stored                       | `secret`       |
| Connected-account caps and payout holds | `PostgresConnectedAccountLimitsDriver`, with who and why           | `confidential` |

## Trust boundaries

1. An action calling `PaymentService`, after the pipeline's permission, step-up and idempotency.
2. The engine to the provider's API through a Connection's managed client.
3. A provider's webhook or return page back to the engine (verified by `@stackra/webhooks`).
4. A till or phone to a terminal (ECR link, Stripe Terminal).

## Threats and controls

| Threat                                                | Control today                                                                                                                            | Open work                                                           |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| A retried charge pays twice                           | One record per merchant reference; a lost answer is `unknown`, resolved by a lookup before any retry; provider idempotency keys          | Idempotency completion committed with the action, STA-2797          |
| A charge is captured, refunded or voided out of order | `InvalidPaymentTransitionError` refuses a transition the state does not allow                                                            | —                                                                   |
| Parts of one bill exceed what is owed                 | Each part is reserved under the balance's lock; `BalanceExceededError`; `settle` counts each part once                                   | —                                                                   |
| A saved card is charged without the customer          | Merchant-initiated charges are flagged and refused where the provider or method does not allow them (`MerchantInitiatedNotAllowedError`) | —                                                                   |
| An AI agent pays without the shopper's confirmation   | An agent checkout needs a protocol's verified wallet proof; the `none` driver confirms nothing (the go-live choice)                      | —                                                                   |
| A connected account is paid out without a cap         | The `none` limits driver refuses every question; the `postgres` driver refuses an account with no row                                    | —                                                                   |
| A forged "paid" webhook marks an order paid           | Webhooks are verified before parsing; the engine re-reads the payment from the provider before trusting a status                         | Regional schemes certified against each sandbox (owner decision D3) |
| Card data enters Stackra's scope                      | Providers' hosted pages, tokens and terminals only; the engine never receives a card number                                              | —                                                                   |
| An agent is offered money-moving tools                | L3 and L4 actions are not tools unless they declare it with a reason (STA-2594)                                                          | —                                                                   |
