---
"@stackra/i18n": minor
---

`@stackra/i18n/native` imports its Expo libraries itself (STA-1534): new `deviceLanguageTags()` and `deviceRegion()`
read the phone's languages and region from expo-localization, so an app no longer passes `getLocales()` and
`getCalendars()` in; `useLanguageSwitcher()` and `<LanguageSwitcher />` reload through expo-updates' `reloadAsync`
unless a `reload` is passed, and on Android 13 and later open the per-app language screen (`APP_LOCALE_SETTINGS` for
the app's package) through expo-intent-launcher. expo-localization, expo-updates, expo-intent-launcher and
expo-constants are new optional peers.
