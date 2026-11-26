---
"@stackra/events": minor
"@stackra/outbox": minor
"@stackra/actions": minor
"@stackra/gen": minor
---

A listener now learns which service published an event from what the transport verified, never from the event (STA-1792, ADR 0509 decision 7, ADR 0511 decision 11). `ListenerContext.producer` is set only by `EventBus.deliver`'s new third argument; a `producer` key in the metadata is dropped and a dispatched event has none. The outbox relay stamps `EventEnvelope.producer` from the deployment identity the generated boot passes (`relay.connect(container, { service: "<member>" })`), never from the stored message. `InboxService.receive(envelope, producer?)` takes the verified producer from its caller: each generated Encore subscription passes its topic's owning service, `RelayInboxService` the verified cross-app signer, and the in-process publisher its own relay's stamp. A cross-app delivery still never sends `producer`. In tests, `deliverRemoteEvent(Type, fields, meta, producer)` delivers as that service.

Breaking for `@stackra/actions`: the interim `ApprovalGrantOrigin` port is removed. `ApprovalExecutorListener` acts only on a delivery whose `ctx.producer` is the service named by the new `ApprovalsConfig.storeService` (key `actions.approvals`, set in runway); left empty, it acts on none. A service that bound an `ApprovalGrantOrigin` driver drops it and sets `actions.approvals.storeService` to the approval store's member.
