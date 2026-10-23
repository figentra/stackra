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

## Pages

| Route          | Page                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| `/`            | the index: what the playground is and a link to every page                                               |
| `/foundations` | the `stackra` theme: colour roles with their contrast pairs, type scale, spacing, radii, shadows, motion |

Add a page as a route folder `src/routes/<name>/` with `<name>.route.ts` (path `/<name>` and title), the page
`<name>.tsx` and `__tests__/`, then one line in `PAGES` in `src/main.tsx`. Its h1 is its title. The end-to-end suite
finds the folder by itself.

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
├── components/playground-shell/       the layout: provider, header, switcher, navigation
├── routes/home/                       `/`
├── routes/foundations/                `/foundations`
├── types/page-link.type.ts            what a navigation link needs
└── styles/app.css                     Tailwind, HeroUI, the stackra fonts and theme
```
