---
"@stackra/notifications": minor
---

The notifications kit blocks (ADR 0504). `@stackra/notifications/react` adds `NotificationInbox` (the header bell and
its grouped inbox, or the same list in place) and `NotificationPreferences` (each topic with one switch per channel; a
channel the organisation or the law keeps on shows disabled). The new `@stackra/notifications/native` entry adds the
native `NotificationInbox` and `PushPrimer` (a card that explains push before the system asks, as a sheet or inline in
onboarding). The blocks talk to the server through two new client ports in `./contracts`,
`NotificationPreferencesClient` and `PushRegistration` (with `NotificationPreferenceRow`, `PushPermission` and
`PrimerTrigger`), with memory drivers in `./testing`. Every word comes from the host.
