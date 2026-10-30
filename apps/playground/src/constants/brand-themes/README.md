# Brand themes and inspired-by presets

Each `<id>.json` is a `stackra.theme-diff/2` layer over the Stackra theme, read by `parseThemeJson` and built by
`buildBrandTheme`. The brand layers are copies of the brand repo's `brands/<id>/tokens/theme.json`. `medusa.json` and
`linear.json` are presets inspired by two other design systems. They take colours, type scale, radius, shadows and
component manners, and use no names, logos or marks of theirs beyond the "-inspired" label. They are not those
products. `apps/mobile/src/constants/brand-themes/` holds identical copies of both.

What the token format cannot say lives in `medusa-preset.css` and `linear-preset.css`: Medusa's shadow-borders,
contrast button and pill tabs, Linear's dense controls, hairlines, lit edges and glow, and the showcase chrome in each
one's manner (flat canvas, neutral navigation, the current row). `brandThemeCss` appends a preset's CSS to the theme
stylesheet while that preset is picked, so it applies only then. The Theme Studio's CSS export renders the theme alone
and does not include it. The mobile app reads only the JSON (see "Mobile" below).

Both presets pass every `DEFAULT_CONTRAST_PAIRS` pair in light and dark (`checkTheme`, pinned by
`__tests__/build-brand-theme.function.test.ts`). Where the source misses WCAG AA, the value moves the least it must,
and the table says so.

## Medusa-inspired (`medusa.json`, `medusa-preset.css`)

Source: Medusa's `packages/design-system/ui-preset` (MIT, Copyright (c) 2023 Medusajs), `src/theme/tokens/colors.ts`,
`effects.ts` and `typography.ts` on `develop`, read 2026-10-28, and the ui package's components. Every colour is that
token's `rgba()` written as hex. To re-sync, read the token named in each row again.

| Stackra                                                           | Light     | Dark        | Medusa token                                                                 |
| ----------------------------------------------------------------- | --------- | ----------- | ---------------------------------------------------------------------------- |
| `background`                                                      | `#FAFAFA` | `#18181B`   | `--bg-subtle`                                                                |
| `surface`                                                         | `#FFFFFF` | `#212124`   | `--bg-base`                                                                  |
| `surface-secondary`                                               | `#FAFAFA` | `#27272A`   | `--bg-component`                                                             |
| `surface-tertiary`                                                | `#F4F4F5` | `#27272A`   | `--bg-base-hover`                                                            |
| `overlay`                                                         | `#FFFFFF` | `#27272A`   | `--bg-base` / `--bg-component`                                               |
| `default`                                                         | `#F4F4F5` | `#27272A`   | `--tag-neutral-bg` / `--bg-component`                                        |
| `segment`                                                         | `#FFFFFF` | `#3F3F46`   | `--bg-base` / `--bg-base-pressed`                                            |
| `foreground` and every `*-foreground` on a surface                | `#18181B` | `#F4F4F5`   | `--fg-base`                                                                  |
| `muted`                                                           | `#52525B` | `#A1A1AA`   | `--fg-subtle`                                                                |
| `accent` (the contrast button)                                    | `#18181B` | `#52525B`   | `--contrast-bg-base` / `--button-inverted`                                   |
| `accent-hover`, `accent-pressed`                                  | `#27272A`, `#3F3F46` | `#71717A`, `#71717A` | `--button-inverted(-hover, -pressed)`; dark pressed held at hover, since `#A1A1AA` is 2.6:1 under white |
| `accent-foreground`                                               | `#FFFFFF` | `#FFFFFF`   | `--fg-on-inverted` / `--fg-on-color`                                         |
| `accent-soft`, `accent-soft-foreground`                           | `#F4F4F5`, `#52525B` | `#FFFFFF14`, `#D4D4D8` | `--tag-neutral-bg`, `--tag-neutral-text`                  |
| `success` (+ `-hover`)                                            | `#047857` | `#34D399`   | `--tag-green-text` dark; light is emerald-700, since `#065F46` reads as text  |
| `warning`                                                         | `#9A3412` | `#FDBA74`   | `--tag-orange-text`                                                          |
| `danger`, `danger-hover`                                          | `#E11D48`, `#BE123C` | `#BE123C`, `#9F1239` | `--button-danger`, `-hover` (dark one step lighter, so it reads on `#18181B`) |
| `*-soft`, `*-soft-foreground`                                     | tag bg / text | tag bg / text | `--tag-{green,orange,red}-bg`, `-text`                                |
| `field-background`                                                | `#FFFFFF` | `#212124`   | `--bg-field-component`                                                       |
| `field-placeholder`                                               | `#71717A` | `#8E8E96`   | `--fg-muted`; dark lifted from `#71717A` (3.3:1) to 4.5:1                    |
| `field-border`                                                    | `#8E8E96` | `#6B6B73`   | none: Medusa's 8% ring is 1.2:1, so the field edge is the 3:1 grey            |
| `border`, `separator`                                             | `#E4E4E7` | `#FFFFFF14` | `--border-base`                                                              |
| `focus`                                                           | `#3B82F6` | `#60A5FA`   | `--border-interactive`                                                       |
| `link`                                                            | `#2563EB` | `#60A5FA`   | `--fg-interactive-hover` (light: `--fg-interactive` is 3.5:1) / `--fg-interactive` |
| `backdrop`                                                        | `#18181B66` | `#18181BB8` | `--bg-overlay`                                                             |
| `shadows.surface`, `.overlay`                                     |           |             | `--elevation-card-rest`, `--elevation-flyout`                                |
| `shadows.field`                                                   |           |             | `--borders-base`'s drop; its ring is `field-border`                          |
| `fontFamily.sans`, `.mono`                                        | Inter     |             | `FONT_FAMILY_SANS` (Inter), `FONT_FAMILY_MONO` (Roboto Mono, not bundled: system mono) |
| `display`, `h1` to `h6`                                           |           |             | `.h3-webs` 40/44, `.h1-docs` 24/30, `.h1-core` 18/28, `.h2-core` 16/24, `.h3-core` 14/20, `.txt-compact-small-plus`, `.txt-compact-xsmall-plus`, all 500 |
| `body`, `small`, `caption`, `label`, `mono`                       |           |             | `.txt-medium` 14/22.4, `.txt-small` 13/20.8, `.txt-compact-xsmall-plus` 12/20, `.code-body` |
| `radius.base` 2px (buttons at 3x: 6px), `field` 6px, steps 4/6/8/12 |         |             | `rounded-md` on button.tsx; `rounded-sm` to `-xl` as the components use them |
| `motion.fast` 150ms, `motion.base` 200ms                          |           |             | `transition-fg` (Tailwind's default timing), the accordion in `plugin.ts`    |
| `materials`: fill 1, no blur, no rim light                        |           |             | Medusa has no translucent material                                           |

The CSS layer's `--medusa-*` properties are the tokens of the same name from `colors.ts` and `effects.ts` (the
`shadow-buttons-neutral`, `-inverted`, `-danger` inner-highlight buttons, `shadow-borders-*`, `elevation-*`,
`details-switch-*`); each rule names the component file it follows. `--medusa-field-edge` is the one value of ours:
`borders-base` with its ring in `field-border`, drawn inset so a clipping parent never cuts it.

## Linear-inspired (`linear.json`, `linear-preset.css`)

Source: linear.app's published stylesheets (`static.linear.app/web/_next/static/css/*.css`, read 2026-10-28), which
declare the custom properties named below for light and dark. Values, not code, are taken; nothing is copied from
Linear's product. To re-sync, fetch the stylesheets and read the property in each row again.

| Stackra                                  | Light       | Dark        | linear.app property                                                       |
| ---------------------------------------- | ----------- | ----------- | ------------------------------------------------------------------------- |
| `background`                             | `#F9F8F9`   | `#08090A`   | `--color-bg-secondary` / `--color-bg-level-0` (`--color-bg-primary`)      |
| `surface`, `field-background`            | `#FFFFFF`   | `#0F1011`   | `--color-bg-level-0` / `--color-bg-level-1`, `--color-bg-panel`           |
| `surface-secondary`                      | `#F4F2F4`   | `#141516`   | `--color-bg-tertiary` / `--color-bg-level-2`                              |
| `surface-tertiary`                       | `#EEEDEF`   | `#191A1B`   | `--color-bg-quaternary` / `--color-bg-level-3`                            |
| `overlay`, `default`                     | `#FFFFFF`, `#F4F2F4` | `#1C1C1F` | `--color-bg-level-0`, `--color-bg-tertiary` / `--color-bg-secondary` |
| `segment`                                | `#FFFFFF`   | `#28282C`   | `--color-bg-level-0` / `--color-bg-quaternary`                            |
| `foreground`                             | `#282A30`   | `#F7F8F8`   | `--color-text-primary`                                                    |
| `muted`, `field-placeholder`             | `#6F6E77`   | `#8A8F98`   | `--color-text-tertiary`                                                   |
| `border`                                 | `#E9E8EA`   | `#23252A`   | `--color-border-primary`                                                  |
| `separator`                              | `#EAEAEB`   | `#202122`   | `--color-line-secondary`                                                  |
| `field-border`                           | `#8F8E96`   | `#5F636B`   | none: `--color-border-tertiary` is 1.4:1, so the field edge is the 3:1 grey |
| `accent`, `accent-foreground`            | `#5E6AD2`, `#FFFFFF` | same | `--color-brand-bg` (indigo), `--color-brand-text`                     |
| `accent-hover`, `-pressed`               | `#5863CC`, `#4F59BD` | same | ours: one and two steps darker, since a lighter indigo drops white under 4.5:1 |
| `accent-soft`, `-soft-foreground`        | `#F1F1FF`, `#4A55BB` | `#18182F`, `#828FFF` | `--color-accent-tint`, `--color-link-primary` (light two steps darker, 4.5:1 on the soft hover) |
| `link`                                   | `#5560C8`   | `#828FFF`   | `--color-brand-bg` one step darker (4.4:1 on the canvas) / `--color-link-primary` |
| `focus`                                  | `#5E6AD2`   | `#7170FF`   | `--color-brand-bg` / `--color-accent`                                     |
| `success`                                | `#1E7F35`   | `#27A644`   | `--color-green`, light darkened until white passes                        |
| `warning`                                | `#F0BF00`   | `#F0BF00`   | `--color-yellow` (dark label on it)                                       |
| `danger`                                 | `#D63A3A`   | `#D63A3A`   | `--color-red` `#EB5757` darkened until white passes (3.6:1 to 4.6:1)      |
| `*-soft`, `*-soft-foreground`            |             |             | ours: each hue at about 8 to 12% over the canvas, its label at 4.5:1 or more |
| `backdrop`                               | `#FFFFFFA6` | `#000000D9` | `--color-overlay-primary`                                                 |
| `shadows.surface`                        |             |             | `--color-border-primary` ring + `--shadow-low` (light) / a 4% lit top edge (dark) |
| `shadows.overlay`, `.field`              |             |             | `--color-border-secondary` ring + `--shadow-high`; `--shadow-tiny`        |
| `fontFamily.sans`, `.mono`               |             |             | `--font-regular` ("Inter Variable", SF Pro Display), `--font-monospace` (Berkeley Mono, not bundled: SF Mono) |
| `display`, `h1` to `h4`                  |             |             | `--title-5` to `--title-1`: 48/1.05, 32/1.125, 24/1.33, 20/1.33, 17/1.4, weight 590 (drawn 600), -0.022 to -0.012em |
| `h5`, `h6`, `body`, `small`, `caption`   |             |             | `--text-regular` 15, `--text-mini` 13, `--text-small` 14 (-0.013em), `--text-mini` 13, `--text-micro` 12 |
| radius: buttons and fields 6px, cards and menus 8px | |             | `--radius-6`, `--radius-8`                                                |
| `body { font-feature-settings }` (CSS)   |             |             | `--font-settings` (`"cv01", "ss03"`)                                      |

## Mobile

The app builds the same JSON into its theme (`apps/mobile/src/constants/brand-themes.constant.ts`), so colours, radius,
type and the token shadows apply on device. The CSS layer has no native counterpart. These do not reach the app:
Medusa's inner-highlight buttons, shadow-border fields and pill tabs; Linear's lit edges, primary glow, hairline
buttons and `cv01`/`ss03` alternates; the 13px dense control sizes; and the showcase-chrome rules. On device the
buttons, fields and tabs draw in the theme's colours with the native components' own shapes.

## Fonts

Inter is self-hosted from `public/fonts/inter/` (Inter 4.001, the static 24pt cut, OFL, copied from the Inter files
expo-dev-menu bundles in node_modules). Inter Display and Roboto Mono are not in the workspace or the brand repo:
Linear's headings use Inter and Medusa's code face falls back to its own system mono stack.
