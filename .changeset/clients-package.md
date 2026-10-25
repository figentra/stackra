---
"@stackra/clients": minor
---

Add `@stackra/clients`, the runtime of the generated clients: the ref factories `#stackra/clients/<service>` is written over (actions, queries, events, refusals, shapes, widgets, modules, permissions, intents), `ServiceClient` with `call` and `queue`, the HTTP `ClientTransport` driver and the `MutationSender` driver that replays the offline queue, the React query and action hooks, the Worker's public clients and forwarded facts, and `fakeClient`.
