---
"@stackra/platform": minor
---

`LiveActivities` follow-ups (STA-1539): `ExpoLiveActivitiesDriver` keeps each running activity's id in storage, so an
activity started before a relaunch is updated and ended rather than started twice; on Android the same calls post an
ongoing notification through expo-notifications; `pushToken` and `onPushToStartToken` give the app the APNs tokens its
server pushes to. `LiveActivityConfig` gains `androidChannelId`, `apnsBundleId` and `apnsEnvironment`.
