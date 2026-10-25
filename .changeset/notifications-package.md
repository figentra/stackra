---
"@stackra/notifications": minor
---

Add `@stackra/notifications`, messages to people (ADR 0086, 0223 as amended by 0294): the `Notification({ category })`
kind base, `NotificationCategory`, `Recipient`, the `Notifier` port with its `memory` driver and `NotificationsConfig`,
the `MailTransport` port in `./contracts`, `useMail` and `MailProps` for `.mail.tsx` bodies in `./react`, and
`renderMail`, `MemoryNotifier` and `MailTransportFake` in `./testing`.
