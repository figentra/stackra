---
"@stackra/theming": minor
"@stackra/ui": minor
---

A native app follows the phone's accessibility settings and text size (STA-1535). `@stackra/theming` adds the
`SystemAccessibility` port (reduce motion, bold text, high contrast, font scale) with `memory`, `browser`
(`prefers-reduced-motion`, `prefers-contrast`) and `accessibility-info` (React Native `AccessibilityInfo`) drivers,
`DEFAULT_ACCESSIBILITY_SETTINGS`, the read-only `useAccessibility()` hook, and `ThemingConfig.maxFontScale`, an optional
cap on the device's text size for dense screens. `@stackra/ui`'s native `DesignSystemProvider` takes `maxFontScale` and
passes it to HeroUI Native's text and text-input scaling, which stays on.
