# Threat model: @stackra/webhooks

<!--
Stackra file contract:
Purpose: the threat model of @stackra/webhooks: verifying inbound provider webhooks (Standard Webhooks and the nine
         signature schemes), routing them to the outbox, and signed outbound delivery to the endpoints a scope
         registers.
Boundary: documentation only; the code wins on any difference. A change that adds an asset, a trust boundary or an
          external call updates this file in the same pull request (constitution SEC10).
Runtime: none
Governing contract: constitution SEC1 (signed webhooks are a documented public endpoint) and SEC10; ADR 0224; ADR 0308
                    (rules 15 to 17); ADR 0448; ADR 0207 (amendment of 2026-11-26: the ASVS level); STA-1357; STA-316.
-->

ASVS level: L1 for every chapter; V13 (API and web service) is this package's own (ADR 0207, amendment of 2026-11-26).
Reviewed: 2026-11-26 (STA-316).

Inbound, a provider's webhook is verified against the secret its Integration names and written to the outbox; outbound,
each `webhook: true` event is signed and posted to the endpoints a scope registered. The threats are forged or replayed
inbound events, and outbound delivery used to reach or probe hosts the tenant should not reach.

## Assets

| Asset                             | Where it lives                                                          | Class          |
| --------------------------------- | ----------------------------------------------------------------------- | -------------- |
| Inbound webhook secrets           | the secret store, named by the Integration or Connection                | `secret`       |
| Outbound endpoint signing secrets | the secret store, named by the endpoint (names only in the table)       | `secret`       |
| Endpoint URLs                     | `webhooks.webhook_endpoints`, shown to the registering scope only       | `confidential` |
| Event payloads                    | the delivery job's input in `queue.jobs`, while it runs or dead-letters | `pii`          |
| The delivery log                  | `webhooks.webhook_deliveries`: ids, wire name, status only              | `internal`     |

## Trust boundaries

1. A provider on the internet to `/webhooks/<module>/<name>/:connectionId`.
2. The receiver to the outbox and the inbox that deduplicates.
3. The delivery job to the tenant's endpoint on the internet (or an S3 target).

## Threats and controls

| Threat                                                      | Control today                                                                                                          | Open work                                                           |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| A forged inbound event                                      | The signature is checked before any field is parsed; a connection's URL verifies only against that connection's secret | —                                                                   |
| A timing attack on the signature comparison                 | Every comparison is constant time (`crypto.subtle.verify`, or `sameBytes` under a one-call random key)                 | —                                                                   |
| A captured inbound event is replayed                        | Signed timestamps within five minutes; the `webhook-id` is the outbox id, and the inbox deduplicates                   | —                                                                   |
| A weak provider scheme (a shared header) is trusted alone   | `shared_header` is marked weaker; the Connection re-reads the payment from the provider before acting                  | Regional schemes certified against each sandbox (owner decision D3) |
| Outbound delivery to an internal address (SSRF)             | None: `register` requires https or an `s3:` target, and leaves private hosts to the runtime's egress policy            | Refuse private and internal hosts, STA-2816                         |
| A redirect sends a signed event elsewhere                   | The `http` sender follows no redirect; a redirect counts as a failure                                                  | —                                                                   |
| A receiver cannot tell a real delivery from a forged one    | Standard Webhooks signatures with the endpoint's secret; rotation keeps the old secret signing for 24 hours            | —                                                                   |
| A failing endpoint holds personal data in the queue forever | About three days of retries, then the dead-letter queue and the endpoint is disabled                                   | —                                                                   |
