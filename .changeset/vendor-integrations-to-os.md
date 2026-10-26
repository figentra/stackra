---
"@stackra/payments": minor
"@stackra/notifications": minor
"@stackra/integrations": minor
---

Move every vendor Integration out of Stackra (owner decision R3-8, STA-1281): the Stripe, Checkout.com, Moyasar,
HyperPay, Paymob, Fawry, Tabby and Tamara drivers and `PAYMENT_CONNECTIONS`; the Resend, SES, Unifonic, Taqnyat,
Twilio, Cequens, Meta WhatsApp and Expo drivers and the `*_CONNECTIONS` maps; and Chatwoot now live in the OS
integrations service. The ports and shared machinery stay. `ConnectionPaymentGatewaysDriver` and the
`Connection*TransportDriver`s take the host's connection class per provider code as their third argument, and
`DevicePushTransportDriver` takes any Integration with a managed client for Expo; callers of the ports are unchanged.
