---
"@stackra/identity": minor
---

Add `ZitadelAuthEventsService` (STA-1579): the receiver of a ZITADEL Actions v2 event target that verifies the
`ZITADEL-Signature` HMAC over the raw body and writes sign-in, failed sign-in, second-factor, lockout and sign-out
events into the audit hash chain through the `AuditTrail` port, mapped by the new `IdpAuthEvent` enum. Add
`IdpAdminConfig.eventsSigningKey` (the `IDENTITY_IDP_EVENTS_SIGNING_KEY` secret).
