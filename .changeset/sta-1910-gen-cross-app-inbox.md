---
"@stackra/gen": minor
"@stackra/cli": patch
---

Cross-app events (ADR 0511 decisions 11 to 19, STA-1910). Gen lifts `client_event_remote_transport`: a listener of a
contract-only producer's event is registered like a sibling's and delivered through a generated inbox, never an
Encore subscription. Such a service gets `#stackra/inbox` (`InboundEventsController` on `POST /events/inbox` over
`RelayInboxService`, and `RelayInboxConfig` with the pinned producers' public keys and events), its Encore `api.raw`
adapter (`.stackra/encore/<member>/inbox.ts`, exposed, `auth: false`) and the boot's `RelayInboxService` connect. A
service whose `runway.yaml` has an `events` block gets the manifest's `relay` section (keys and subscribers per
environment, no origins), an `env` row for its signing key's secret name, `#stackra/events-relay`
(`EventsRelayConfig` picked by `STACKRA_ENVIRONMENT`), the wiring of `CrossAppFanOut`, `CrossAppRelayService` and
the Postgres `DeliveryDriver`, and the cross-app relay loop in its boot. The new warning `client_event_unsubscribed`
names a listener whose producer's contract does not list the service for that event; `GenerateResult.warnings`
carries it and `stackra gen` prints it. Members with neither keep the same output.
