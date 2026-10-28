---
"@stackra/platform": minor
---

`ExpoSystemSettingsDriver` is concrete (STA-1536): it imports expo-tracking-transparency, expo-battery and
expo-background-task itself, so an app binds it directly instead of subclassing it to hand the libraries over; a test
subclass can still replace `modules`. The three Expo libraries are new optional peers.
