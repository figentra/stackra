---
"@stackra/theming": minor
---

The theming kit's first blocks (ADR 0504). `AppearanceToggle` in `@stackra/theming/react` picks the colour scheme
(the schemes `ThemingConfig` offers) through `useColorScheme`: as segments, as a dark-mode switch or as a menu behind a
button for a site header, with an optional controlled `value` and `onChange`. `BrandLogo`, in `@stackra/theming/react`
and `@stackra/theming/native`, draws the theme's own logo through the container's `AssetLibrary`, or the host's logo
for the scheme on screen, with a fallback while there is none. Every word comes from the host. The showcase lists both
under Blocks.
