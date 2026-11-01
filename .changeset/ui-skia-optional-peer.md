---
"@stackra/ui": patch
---

`@stackra/ui/native` loads in an app without `@shopify/react-native-skia`, which stays an optional peer (Expo SDK 57's
2.6.2). The Skia-backed charts, maps and the chart export reach Skia and `victory-native` through lazy `require`s the build
keeps for Metro, and draw nothing when the app has not installed them (STA-1791).
