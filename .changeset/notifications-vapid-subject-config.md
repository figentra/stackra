---
"@stackra/notifications": minor
---

The Web Push VAPID contact is configuration now: `NotificationsConfig.webPushVapidSubject` (a `mailto:` or `https://`
URL set in the member runway's config), which `DevicePushTransportDriver` takes as an optional last constructor
argument. Until a host passes it, the driver still reads the `WEB_PUSH_VAPID_SUBJECT` secret.
