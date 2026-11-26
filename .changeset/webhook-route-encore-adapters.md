---
"@stackra/gen": minor
"@stackra/app": minor
---

Provider webhooks now reach a generated app (STA-1955). gen bound the inbound webhook route, `InboundWebhooksController` of `#stackra/webhooks`, but wrote no Encore endpoint for it, so a Paymob, Tamara, Resend or Stripe delivery had nowhere to land. A service that receives webhooks now gets two `api.raw` adapters per Integration in `.stackra/encore/<member>/api.ts`: `/webhooks/<module>/<name>` (the platform account) and `/webhooks/<module>/<name>/:connectionId`, any method, answered through `answerCall` behind the request guards and the body cap. There is no `/webhooks/*rest` route per service, which two services of one app would both claim.

`serveGuardedCall` takes a new `credentials: "ignore"` option (and the generated `answerCall` passes it through): the call reads no credential and runs as the anonymous actor, while the `Authorization` header still reaches the handler. Every webhook adapter sets it, because a provider's `Authorization` header is its own signature (Tamara sends a JWT there), which the receiver verifies; before this, such a delivery would have been answered 401 by `CallAuthenticator`. Run `stackra gen` to write the adapters; the generated `http.ts` of every service gains the pass-through.
