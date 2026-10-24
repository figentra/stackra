# @figentra/playground

The Stackra Design System playground: every @stackra/ui component on its own route, in light and dark and in
left-to-right and right-to-left, checked by Playwright and axe.

Vite + React 19 + React Router 7 (code-based routes) + HeroUI v3 (Tailwind CSS v4), wrapped in
`@stackra/ui/react`'s `DesignSystemProvider` and themed by `@stackra/tokens` (the `stackra` theme). It is the
component review surface of ADR 0302: ordinary app routes that import the real public entries, not Storybook, with no
`*.stories.*` files (ADR 0128, 0227). It is a dev tool and is not deployed.

Run it from the root with `pnpm --filter @figentra/playground dev`: http://localhost:3710.

## Theme and direction

The header's switcher (HeroUI `Toolbar` and `ToggleButtonGroup`) picks the colour scheme (light, dark, system) and the
language (English, left to right; Arabic, right to left). Both live in the URL, so each view deep-links:

```text
/foundations?scheme=dark&locale=ar
```

## Navigation and the glass

There is no sidebar. The index (`/`) is the landing: a hero, a live showcase of scenes built from `@stackra/ui`, and
a gallery with one glass panel per category (free pages first, Pro pages badged, an All / Free / Pro filter). Every
page is one search away: the command palette opens from the bar's search button, ⌘K or Ctrl+K, and `/`. A component
page shows its category as a strip above it (the current page marked) and the previous and next pages below it; the
page itself sits on a solid sheet of the theme's background, because its samples are tuned against that colour.

The glass (`glass`, `glass-strong` in `src/styles/app.css`) is built from the theme's roles only. It turns solid under
`prefers-reduced-transparency`, `prefers-contrast: more` and in browsers without `backdrop-filter`, keeps an edge in
forced colours, and its motion stops under `prefers-reduced-motion`. The ambient field under it is flat tints shaped by
masks, so axe measures text against every tint at once rather than giving up on a gradient.

## Pages

| Route          | Page                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| `/`            | the index: what the playground is and a link to every page                                                          |
| `/foundations` | the `stackra` theme: colour roles with their contrast pairs, type scale, spacing, radii, shadows, motion            |
| `/icon`        | `Icon`: sizes, tones, decorative and labelled use, mirrored and never-mirrored icons, own components, a live sample |
| `/typography`  | `Text` and `Heading`: every type, level, tone, alignment, truncation and language, a live sample                    |

Add a page as a route folder `src/routes/<name>/` with `<name>.route.ts` (path `/<name>` and title), the page
`<name>.tsx` and `__tests__/`, and nothing else: the router, the gallery, the palette and the e2e suite find it. Its h1 is its title. The route class also
names its `category` (`Foundations`, `Actions`, `Typography` or `Navigation`, in `src/enums/page-category.enum.ts`),
which groups it in the shell's navigation and on the index. The end-to-end suite finds the folder by itself.

Every finished component belongs here, to be checked, tried and tested: each variant, size, tone and state with a
short caption, and at least one live sample (a pressable button that updates a counter or toggles state). Pages
import the kit as `import * as Ui from "@stackra/ui/react"`; icons are drawn by name (`<Ui.Icon name="search" />`), from the registry in
`src/components/playground-icons`, which holds only the icons the pages use.

## Commands

| Command          | Does                                                                           |
| ---------------- | ------------------------------------------------------------------------------ |
| `pnpm dev`       | Dev server on port 3710                                                        |
| `pnpm build`     | Production bundle in `dist/`                                                   |
| `pnpm preview`   | Serve the built bundle on port 3710                                            |
| `pnpm typecheck` | `tsc --noEmit`                                                                 |
| `pnpm test`      | Vitest (jsdom), the unit tier                                                  |
| `pnpm test:e2e`  | Playwright + axe over every route in the four views (build, preview, Chromium) |
| `pnpm lint`      | oxlint                                                                         |
| `pnpm format`    | oxfmt                                                                          |

`pnpm test:e2e` needs Chromium once: `pnpm --filter @figentra/playground exec playwright install chromium`. It is not
part of `pnpm verify`; CI runs it in the Quality Gate after the build.

## Structure

```text
stackra.config.ts                      the app definition (ADR 0295)
index.html                             stand-in until gen writes it; sets scheme and direction from the URL before paint
playwright.config.ts                   the e2e tier: Chromium against `vite preview`
e2e/__tests__/playground.e2e.test.ts   every route × light/dark × LTR/RTL, h1, <html> attributes, axe (ADR 0022 d3)
src/
├── playground.module.ts               the root module
├── main.tsx                           stand-in entry and route tree until gen writes them (STA-339)
├── components/playground-shell/       the layout: provider, glass bar, switcher, category strip, pager, palette
├── components/command-palette/        search every page (⌘K, Ctrl+K or `/`)
├── components/category-nav/           a component page's category strip
├── components/page-pager/             previous and next page
├── components/page-gallery/           the index gallery: a glass panel per category, All / Free / Pro
├── components/showcase/               the index page's live scenes
├── components/hero-art/               the index hero's decorative glass stack
├── components/choice/                 a switcher choice with a check mark
├── routes/home/                       `/`
├── routes/foundations/                `/foundations`
├── routes/icon/                       `/icon`
├── routes/typography/                 `/typography`
├── components/page-list/              the pages grouped by category, as rows (the palette)
├── components/page-section/           a named region with a level-2 heading and a note
├── enums/page-category.enum.ts        the page categories, in navigation order
├── enums/page-tier.enum.ts            Free and Pro (a `/pro-*` path is Pro)
├── types/shell-context.type.ts        what the shell hands a page (open the palette)
├── types/page-link.type.ts            what a navigation link needs
└── styles/app.css                     Tailwind, HeroUI, the stackra fonts and theme, the glass material
```
