---
"@stackra/webhooks": minor
---

Six `SignatureScheme` codes and verifiers for the regional gateways' webhook schemes that are not an HMAC over the raw
body (STA-1357, certification pending per owner decision D3): `body_token` (`verifyBodyToken`, Moyasar), `aes_gcm_body`
(`decryptAesGcmBody`, HyperPay), `ordered_field_hmac` (`verifyOrderedFieldHmac`, Paymob), `keyed_field_digest`
(`verifyKeyedFieldDigest`, Fawry), `shared_header` (`verifySharedHeader`, Tabby) and `jwt_hs256` (`verifyJwtHs256`,
Tamara), each reading the Integration's `webhooks.recipe`, all constant-time. `InboundWebhook` takes optional `query`
parameters; `WebhookReceiver` verifies through `authenticBody` (parsing an AES-GCM body's plaintext) and keys these
events by the payload's `eventId` path; `registerWebhookEvents` refuses a scheme whose `recipe` fields are missing.
