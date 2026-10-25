---
"@stackra/ui": patch
---

Two fixes for Hermes, the React Native engine:

- **FilterBar no longer crashes on native.** Hermes has no `Intl.ListFormat`, and the FilterBar called it to name
  the one or two chosen options in a chip. Where it is missing, the chip now joins those labels with commas.
- **`directionOf` reads Arabic and other right-to-left locales correctly on native.** It used `Intl.Locale`, which
  Hermes also lacks. Where it is missing, it reads the locale tag's script, or else its language.
