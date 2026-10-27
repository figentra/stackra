---
"@stackra/notifications": minor
---

`OutboundMail` gains `cc`, `bcc`, `replyTo`, `headers` and `attachments` (`MailAttachment`: bytes or a storage `ref`,
with an inline `contentId`). `ConnectionMailTransportDriver` passes them through, refuses a part outside the sender's
`supports` with `MailFeatureUnsupportedError` before calling it, and refuses injected headers. New `PreferenceStore`
port with `MemoryPreferenceStoreDriver` and `preferenceAllows` (mandatory categories are never turned off), the signed
one-click unsubscribe link (`unsubscribeLink`, `verifyUnsubscribeToken`, HMAC with the `NOTIFICATIONS_UNSUBSCRIBE_KEY`
secret) and the RFC 8058 `listUnsubscribeHeaders` for bulk categories. Config adds `unsubscribeUrl` and
`unsubscribeKey` (stackra-218, STA-1376).
