---
"@stackra/platform": patch
---

Fix a launch crash on iOS: `ExpoSystemSettingsDriver.tracking()` called expo-tracking-transparency's status read,
which is fatal (`RCTFatal`) in an app without `NSUserTrackingUsageDescription`. Tracking now reads `denied` without
calling the library unless the host sets `asksForTracking` (a driver subclass, added with the plugin and its usage
string); `requestTracking()` then never prompts.
