---
"@stackra/platform": minor
---

Add `LiveActivityPushes` (STA-1539), the server half of `LiveActivities`: start, update or end an activity remotely
by pushing to the token the device handed over. Ships `MemoryLiveActivityPushesDriver` and
`ApnsLiveActivityPushesDriver` (`./node`), an APNs `liveactivity` push over HTTP/2 signed with the `APNS_*` secrets.
