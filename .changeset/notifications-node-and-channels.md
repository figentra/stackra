---
"@stackra/notifications": minor
---

Add the `./node` entry with `NotificationsNotifierDriver`, the `notifications` Notifier driver: it renders each
notification's mail (subject and `.mail.tsx` body) and queues `messages.message.send@1` on the notifications service
through `@stackra/clients`, once per principal. `registerNotificationMails` records the mail bodies and lang loaders it
renders with. Follow-up that must land before the template selects `driver: notifications` for staging or production: gen's emit-registrations does not yet emit `registerNotificationMails`, so every mail notification throws a TypeError until it does. `NotifierDriverName` and `NotificationsConfig$` accept `notifications`. Add the
`SmsTransport`, `InAppStore` and `ChatTransport` channel ports to `./contracts`, with `SmsTransportFake`,
`InAppStoreFake` and `ChatTransportFake` in `./testing`.
