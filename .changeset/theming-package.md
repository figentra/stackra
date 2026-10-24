---
"@stackra/theming": minor
---

Add `@stackra/theming`, the colour scheme and the look of a member. `ThemingConfig` (`theming`) with its shipped
schema `ThemingConfig$` holds the theme by name, the logo source (an asset key or entry), the schemes on offer and the
first one, the theme colour and splash background per scheme, self-hosted fonts and the tenant colour switch, with
defaults from the `stackra` theme of `@stackra/tokens`. `ColorSchemeService` keeps the user's choice in the `prefs`
storage area, resolves `system` through the new `SystemColorScheme` port (`./contracts`) and notifies on change; its
drivers are `MemorySystemColorSchemeDriver` (`.`), `BrowserSystemColorSchemeDriver` (`./browser`) and
`AppearanceSystemColorSchemeDriver` (`./native`). `useColorScheme` (`./react`) returns `{ scheme, resolved, setScheme }`
on web and native and never mismatches on hydration. `ColorScheme` is re-exported from `@stackra/ui/contracts`.
`fakeColorScheme` (`./testing`) seeds a real service for tests, and English and Arabic labels ship for the scheme names.
