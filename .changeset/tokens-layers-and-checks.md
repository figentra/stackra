---
"@stackra/tokens": minor
---

Layers and checks (ADR 0340).

- `resolveTheme(base, layers, rootPolicy?)` folds a theme through brand layers. A `ThemeLayer` is a `ThemeDiff` with an `id`, a kebab-case `name` (`themeNameOf(id)` derives one), the theme it `extends` and an optional `LayerPolicy` (`allow` and `lock` path patterns, extra contrast pairs, separation rules).
- The fold never throws. It refuses a wrong parent, a locked or disallowed path, a widened policy, an invalid value, a hex that is not its oklch value, and a contrast pair below its minimum. Each refusal offers the nearest passing colour for the colours the last layer changed; nothing is adjusted silently.
- A separation breach is a notice: the theme is accepted with `requiresIconAndLabel`.
- `checkTheme(theme, pairs?)` measures `DEFAULT_CONTRAST_PAIRS` (HeroUI's role pairs) as the components paint them. That includes HeroUI's `color-mix` hover and soft colours (`HEROUI_DERIVED_COLOURS`, through `paintedColour` and `pairRatio`), with translucent colours composited over the page. `checkSeparation` and `suggestColour` complete the set.
- `defineTheme` is unchanged, so existing themes keep working; the gates arrive only through a policy.
- The stackra theme gains `palette.warning-hover`, one step darker than the warning colour in both schemes. HeroUI's own warning hover left the light warning button's text at 4.22:1.
