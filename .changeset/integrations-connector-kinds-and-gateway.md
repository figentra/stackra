---
"@stackra/integrations": minor
---

Add `connectionsOf`, the lookup of registered connection classes by connector kind or category, and
`ConnectorGateway`, which resolves the Connection of a fulfilment provider (3PL, WMS), sales channel, product feed, EDI
network, fraud scorer or document store by provider or by the ADR 0356 pick (ADR 0447). Extend
`SalesChannelConnector` with optional reject, cancel, prep time, menu with modifier groups, availability, listing
content and returns, and `ChannelOrder` with `paymentMethod`. Add the `EdiConnector`, `FraudScoringConnector` (the score
is a rule fact) and `DocumentStoreConnector` contracts with the `edi`, `fraud_scoring` and `document_store` connector
kinds, the `edi`, `fraud`, `food_delivery`, `courier`, `document_management`, `esl`, `scales` and `court` categories,
and `MemoryFulfilmentProvider` in `./testing`.
