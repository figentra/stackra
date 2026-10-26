---
"@stackra/notifications": minor
---

`NotificationsNotifierDriver` takes a `NotifierTarget` (any action and a payload mapper given the template, category,
principal, market and rendered channels); `MESSAGES_NOTIFIER_TARGET` keeps the old default. `InAppMessage` gains a
required `product`, and `InAppStore.list` filters by it (ADR 0422).
