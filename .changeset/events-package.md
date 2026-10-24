---
"@stackra/events": minor
---

Add `@stackra/events`, events and listeners of the programming model v3.1: the abstract `Event` base with a typed
static `create`, the kind bases `DomainEvent` (bare), `IntegrationEvent({ name, version, webhook, broadcast })`,
`WebhookEvent<I>({ type })` and `AnalyticsEvent({ name })`, `BroadcastAudience`, the `Listener` kind base in both forms
with `ListenerContext`, `registerListeners`, the in-process `EventBus` that isolates listener failures, and recording
kept off the aggregate (`recordEvent`, `takeRecordedEvents`); `./contracts` with the `EventOutbox` port, `EventMeta` and
`RecordedEvent`; and `./testing` with `dispatch`, `drainEvents`, `drainOutbox`, `deliverRemoteEvent`, the `OutboxFake`,
the `toEmit` and `toRecord` matchers and the testing-module plugin that adds `app.events` and `app.listeners`.
