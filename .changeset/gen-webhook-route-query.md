---
"@stackra/gen": patch
---

The generated inbound webhook route (`.stackra/gen/webhooks.ts`) now passes the request's decoded query parameters to
`WebhookReceiver.receive` as `InboundWebhook.query`, so query-signed schemes verify (Paymob `?hmac=`, Tamara
`?tamaraToken=`; STA-1359).
