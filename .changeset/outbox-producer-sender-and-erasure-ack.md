---
"@stackra/outbox": minor
"@stackra/gen": minor
"@stackra/events": patch
"@stackra/privacy": minor
"@stackra/workflow": minor
---

A topic no longer proves who sent an event on its own, and an incomplete erasure now says so wherever completeness is read (STA-1792, STA-2629).

Producer: `OutboxRelayService.connect` takes the wire names its service publishes (`{ service, publishes }`; the generated boot passes the built manifest's integration events, hosted packages' included) and dead-letters at once, unpublished, an event message of any other wire name (code `event_not_published`, log `outbox.message_foreign`). A consumer imports another service's event class to listen to it, and its topics for its subscriptions, so without this it could send that service's event on that service's topic. The new `InboxService.receiveFromTopic(envelope, owner)` takes the topic's owner as the verified producer only when the relay's stamp names the same service, and otherwise delivers with no producer; generated Encore subscriptions call it instead of `receive`. Regenerate each service (`stackra gen`) so its boot passes `publishes` and its subscriptions call `receiveFromTopic`.

Erasure: `SubjectErased` gains an optional `unredacted` count (`privacy.subject.erased.v1`, additive), and the erasure saga lists the held outbox messages it could not redact as a `kept` entry (`outbox.message`, reason `unredacted`) on its receipt, on `SubjectErased` and on the `ServiceAcked` a cross-service erasure waits on, so the waiting service's `AllServicesAcked.kept` shows them; it also logs `privacy.erasure_unredacted` (the erasure id and the count only). `KeptRecords.reason` and `KeptRecords$` accept `unredacted`. `EraseSubjectWorkflow` takes the `Container` as its fourth constructor argument (generated wiring passes it).
