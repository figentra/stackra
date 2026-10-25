---
"@stackra/notifications": minor
---

Add provider drivers chosen per tenant and Market through `@stackra/integrations`' `ProviderResolver` (ADR 0356):
Resend and SES (SigV4) mail; Unifonic, Taqnyat, Twilio and Cequens SMS; the WhatsApp Cloud API as its own
`WhatsAppTransport` channel; Expo and Web Push (VAPID, `aes128gcm`) through `PushTransport` with dead-device revocation
(`PushTokenStore`) and Expo receipts; Twilio voice as a `VoiceGateway` with TwiML. Connection transports send once per
idempotency key through the new `SendLog` port. Add `resolveTemplate` (the cascade of code defaults and scope overrides
along the locale chain, with content-free variants for restricted records), `sendAfter` (quiet hours with mandatory
categories from settings) and `dueEscalations` (acknowledgement and escalation from rule data), plus the
`NotificationChannel` and `TemplateVariant` enums and push and WhatsApp test fakes.
