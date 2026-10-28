---
"@stackra/i18n": minor
---

Native apps follow the phone's language and region (STA-1534). `I18nConfig.nativeSwitcher` (`NativeSwitcher`:
`system`, the default, or `in_app`) decides who owns the language choice; `nativeSwitcherMode` runs `in_app` below
Android 13. New `./native` entry with `useLanguageSwitcher()` and `<LanguageSwitcher />`: under `system` choosing opens
the phone's language screen for the app, under `in_app` it switches through `setLocale` and, across right-to-left,
flips the layout and calls the app's `reload`. New pure helpers `startingLocale`, `matchDeviceLocale` and
`regionFormat` (the phone's region, clock, first weekday, units and time zone, with an account or business override);
`I18nProvider` takes a `region` prop and `useDateTime` formats in its zone. React Native is a new optional peer.
