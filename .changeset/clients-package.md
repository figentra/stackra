---
"@stackra/clients": minor
---

Add `@stackra/clients`, the runtime of the generated clients: the ref factories `#stackra/clients/<service>` is written over (actions, queries with their replica declarations, events, refusals, shapes, widgets, modules, permissions, intents), `ServiceClient` with `call` and `queue`, the HTTP `ClientTransport` driver, the drivers of `@stackra/query`'s offline ports (the `MutationSender` that replays the queue with its device order, the `ReplicaSource` and the `AcknowledgementReader`) with the `DEVICE_ORDER` wire names, the React query and action hooks, the Worker's public clients and forwarded facts, and `fakeClient`.
