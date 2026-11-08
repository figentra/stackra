---
"@stackra/app": minor
"@stackra/identity": minor
"@stackra/clients": minor
"@stackra/actions": minor
"@stackra/gen": minor
---

A service now proves who it is when it calls another service, and who it acts for.

- An outgoing service call sends the service's own token (`Authorization: Bearer`). `ServiceTokens` in
  `@stackra/identity` answers it, with a memory driver for tests; the token is issued for the receiving product's
  project, set per module in `clients.audiences`.
- When the call acts for a user, it also sends that user's own token in `Stackra-On-Behalf-Of`. `serveGuardedCall` in
  `@stackra/app/server` keeps that token for the one request and empties it when the request ends. It is never put on
  the actor, the call context, a log, an error or an event.
- A user's token travels one hop. A service called for a user forwards it again only into an action that declares
  `onBehalfOf: { secondHop: true }`; otherwise its own calls carry the service token alone.
- `ServiceClientSessionDriver` (`service`) is the `ClientSession` a service binds for its generated clients, and
  `ClientSession.headers` now receives the call it is about to send.
- Generated endpoints name their action to `serveGuardedCall`, which reads its second-hop option. A hand-written
  controller forwards only a user's own token, never a forwarded one.
