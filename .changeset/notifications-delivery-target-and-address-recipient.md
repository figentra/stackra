---
"@stackra/notifications": minor
---

Config `notifications.target` picks the `notifications` driver's built-in target: `messages` (default, unchanged) or
`delivery` (`DELIVERY_NOTIFIER_TARGET`, `delivery.message.send@1` with the category code, template values, rendered
mail and Market). `Notification({ messageCategory })` names the delivery service's category code.
`Recipient.address(email)` addresses a person with no account; `NotifierTarget.addressPayload` and the
`NotifierAddressMessage` type carry it (ADR 0422 as amended, STA-1235).
