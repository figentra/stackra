---
"@stackra/platform": minor
---

Add `HomeWidgets` (STA-1539): the app publishes a glance (title, value, caption) that its `Glance` home-screen and
Lock Screen widget shows from the shared app group; `ExpoHomeWidgetsDriver` writes it through expo-widgets, and
`MemoryHomeWidgetsDriver` serves tests and the web. Add `AppShortcuts` for App Shortcuts and Siri intents (runs and
donations) with `MemoryAppShortcutsDriver`; its Expo driver follows once expo-app-intents is catalogued.
