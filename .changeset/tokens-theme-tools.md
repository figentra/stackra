---
"@stackra/tokens": minor
---

Theme tools for the playground's Theme Studio, usable by any tool:

- `deriveTheme(base, knobs)`: an accent, a neutral hue and tint, a radius, the faces and a name make a full, checked theme.
- `themeVariables`: the web custom properties, split into HeroUI's and Stackra's, per mode. `renderWebCss` now writes from it, so the order of declarations in `web.css` changed.
- `materialModeVariables`.
- `diffTheme` and `mergeTheme`. The merge drops unsafe keys and checks the result.
- `exportThemeJson` (`stackra.theme/1`) and `exportThemeDiff` (`stackra.theme-diff/1`).
- `parseThemeJson`: size-capped and checked.
- `themeToDtcg`: W3C design tokens.

New types `ThemeKnobs`, `ThemeDiff` and `ThemeVariables` in `./contracts`.
