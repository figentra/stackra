# @stackra/brand

The Stackra visual identity in code: one source for tokens, the HeroUI themes (web and native), fonts, logos, marks,
icons and app icons. Every app takes its brand from here.

**Kind:** lib — design tokens and static resources. **Tier:** `tier:lib` (`packages/experience/brand`).

## Licence

The code (`src/`) and the stylesheets and token files (`resources/heroui/`, `resources/tokens/`,
`resources/fonts/fonts.css`) are MIT like the rest of the repository. **The brand assets are excluded from the MIT
licence (owner decision, ADR 0024): all rights reserved**, as `resources/NOTICE` states: logos, marks, app icons,
favicons, splash images, icons, patterns, illustrations and the email templates. The fonts keep their SIL Open Font
License, whose texts sit beside them (`resources/fonts/OFL-*.txt`).

## Source

The approved Stackra brand kit (`.old/brand-kits/stackra`, kit version 0.1.0, outside this repository) is the design
source. This package vendors its output; never point at the kit by path. When the kit changes, re-copy the changed
files: `heroui/*.css` → `resources/heroui/`, `tokens/*.json` → `resources/tokens/`, `logos/svg/*` →
`resources/logos/`, and so on. `src/__tests__/resources.test.ts` fails if `src/tokens/tokens.ts` drifts from
`resources/tokens/resolved.json` or from `resources/heroui/web.css`.

Stackra has **no accent colour**: every accent role is a neutral (ink on paper, paper on ink). Steel colours the
wordmark and the st tile only. Amber appears only as the bar inside the "by figentra_" signature.

## What it holds

| Content                                              | Where                                                                                                     |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Colour, typography, spacing, radius, motion          | `src/tokens/tokens.ts` (typed), `src/tokens/tokens.json`                                                  |
| HeroUI v3 React theme (all tokens, light/dark)       | `resources/heroui/web.css` (also exported as `./tokens.css`)                                              |
| HeroUI Native / Uniwind theme                        | `resources/heroui/native.css`                                                                             |
| Kit token sources and reports                        | `resources/tokens/` (brand, color, aliases, resolved, contrast, separation)                               |
| Fonts + `@font-face`                                 | `resources/fonts/` (Geist, Geist Mono, IBM Plex Sans Arabic woff2, `fonts.css`, OFL)                      |
| Logos                                                | `resources/logos/` (beam-S wordmark, small wordmark, endorsed lockup EN/AR, st tile 16/32/64; light/dark) |
| "by figentra_" signature                             | `resources/marks/` (EN/AR, horizontal/compact, light/dark)                                                |
| App icons                                            | `resources/app-icon/` (SVG light/dark; 1024 PNG rounded, iOS square, Android adaptive foreground)         |
| Favicons                                             | `resources/favicon/` (`favicon.ico`, SVG 16/32/48)                                                        |
| Splash marks                                         | `resources/splash/` (st tile 256 PNG light/dark)                                                          |
| UI icons, patterns, illustrations                    | `resources/icons/` (28, 24px 2px stroke), `resources/patterns/`, `resources/illustrations/`               |
| Email templates (for a future communication package) | `resources/email/` (EN/AR; placeholders, see below)                                                       |

## Consumption

```css
/* Web (Tailwind v4 + HeroUI v3): after @import "@heroui/styles" */
@import "@stackra/brand/resources/fonts/fonts.css";
@import "@stackra/brand/resources/heroui/web.css";

/* Mobile (Uniwind + HeroUI Native): after @import "heroui-native/styles" */
@import "@stackra/brand/resources/heroui/native.css";
```

```ts
import { colors, fontFamily, motion } from "@stackra/brand";

colors.accent.hexLight; // "#0B0D0F"
```

Files load by path, for example `@stackra/brand/resources/logos/stackra-wordmark-light.svg`. Files that a tool reads
from disk (Expo `app.json`, electron-builder) use `./node_modules/@stackra/brand/resources/…`. Mintlify reads only its
own folder, so `apps/docs/src/assets` holds copies of the wordmark and favicon.

### Arabic and RTL

`web.css` sets the IBM Plex Sans Arabic stack on `:root:lang(ar)` and carries the `-ar` type scale (`--body-ar` and
so on). The Latin name stackra leads in both locales; the Arabic name ستاكرا is not used (Brand System `[TBD]`). Every
Arabic string from the kit (the AR lockups, marks and email templates) is still waiting for native review
(`ARABIC-REVIEW.md` in the kit): treat it as draft.

### Placeholders

The email templates are stored for later, not in use: every `[bracketed]` value in them (month, reason, registered
address, receipt facts) is a fact the kit refused to invent (`PLACEHOLDERS.md` in the kit), and their image `src`s
point at `../logos/png/…`, which must become a public URL before sending. No other resource holds a placeholder.

On native, Expo cannot load woff2, so the mobile app uses the system face until TTF builds of the brand fonts are added.

## Entry points

| Import                           | Holds                                                                                                |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `@stackra/brand`                 | TS tokens (`colors`, `typography`, `fontFamily`, `spacing`, `radius`, `shadows`, `motion`, `tokens`) |
| `@stackra/brand/tokens`          | the TS token module                                                                                  |
| `@stackra/brand/tokens.css`      | `resources/heroui/web.css`                                                                           |
| `@stackra/brand/tokens.json`     | JSON token dump                                                                                      |
| `@stackra/brand/resources/*`     | any resource file                                                                                    |
| `@stackra/brand/logos`, `/fonts` | the logo and font folders (kept for older imports)                                                   |

`exports` point at source; `tsdown` builds `dist/` only for publishing.

## Tasks

| Task            | Command                                         |
| --------------- | ----------------------------------------------- |
| `build`         | `tsdown`                                        |
| `typecheck`     | `tsc --noEmit`                                  |
| `lint`          | `oxlint .`                                      |
| `test`          | `vitest run`                                    |
| `test:coverage` | `vitest run --coverage` (shared gate: 80/80/70) |
| `format`        | `oxfmt --write .`                               |
| `format:check`  | `oxfmt --check .`                               |
| `clean`         | `rm -rf dist coverage .turbo`                   |

Run one with `pnpm turbo run <task> --filter=@stackra/brand`.
