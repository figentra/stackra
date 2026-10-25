---
"@stackra/tokens": minor
---

`renderNativeCss` writes the theme's palette as Uniwind colours (STA-455).

- Each palette entry becomes `--color-<name>` in both `@variant light` and `@variant dark`.
- HeroUI Native's own `color-mix` steps of the same name take the theme's value, as `web.css` already does:
  `accent-soft`, `accent-soft-foreground` and `accent-hover`. So native soft chips, alerts and tags paint the
  colours `checkTheme` measures.
- The other entries become Uniwind classes, such as `bg-accent-pressed` or a product's accent ramp.
- The committed `themes/stackra/native.css` is regenerated. For the stackra theme, the accent label holds at least
  9.2:1 on the accent, hover and pressed steps, and the soft pair holds at least 14:1, in both schemes.
