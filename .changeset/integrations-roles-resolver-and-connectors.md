---
"@stackra/integrations": minor
---

Add the five Integration roles and connector kinds (ADR 0355), a fuller listing (support, privacy and terms links and an
Entitlement reference), the `booking`, `telephony` and `wallet` categories, and per-region base URLs with `{field}`
placeholders and form bodies in the managed client. Add `ProviderResolver` with the `ProviderDefaults` and
`MarketContext` ports for choosing a provider per tenant and Market (ADR 0356), `credentialRef` for credential vault
references, `postJournal` and `assertBalanced` for balanced, idempotent journals behind the `AccountingProvider`
interface, the `SalesChannelConnector`, `ProductFeedConnector` and `FulfilmentProviderConnector` interfaces, the
telephony port (`VoiceGateway`, `CallInstruction`, `CallStatus`, `RecordingConsent`, `recordingPlan`), the `Pass` kind
for wallet passes, and the headless Chatwoot integration (Platform API provisioning, inboxes, contacts, conversations,
messages, assignment).
