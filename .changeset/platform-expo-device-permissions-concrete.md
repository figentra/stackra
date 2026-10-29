---
"@stackra/platform": minor
---

`ExpoSystemPermissionsDriver` is concrete (STA-1536): it imports expo-camera, expo-location and expo-media-library
itself, so an app binds it directly instead of subclassing it to hand the libraries over; a test subclass can still
replace `modules`. expo-location and expo-media-library are new optional peers.
