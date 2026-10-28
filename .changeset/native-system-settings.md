---
"@stackra/platform": minor
"@stackra/consent": minor
"@stackra/notifications": minor
---

Follow the phone's system-owned settings (STA-1536): the `SystemSettings` port with its memory driver and the abstract
`ExpoSystemSettingsDriver` (App Tracking Transparency, Low Power Mode, an expensive connection, background refresh and
the settings deep link), `createNotificationChannels` for one Android channel per category, `OutboundPush.channelId`,
and `ConsentLedger.setAppTrackingDenied`, which refuses marketing on the client and in the signed snapshot.
