# @stackra/ui-pro

Stackra Design System Pro components for Stackra's own apps only: the @stackra/ui props vocabulary over HeroUI Pro on web and HeroUI Native Pro on native. Private, never published.

**Tier:** `tier:lib` (`packages/design-system/ui-pro`). Laid out in the programming model v3 (ADR 0294, 0295).

## Entry points

Private and never published (ADR 0310): only Stackra's own apps import it. `@stackra/ui` and every free package never do;
`pnpm validate` refuses it.

| Import                      | Holds                                                                                                                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@stackra/ui-pro`           | `src/config/ui-pro.config.ts`: `UiProConfig`                                                                                                                                              |
| `@stackra/ui-pro/contracts` | the props contracts (`<Name>ContractProps`) on `@stackra/ui/contracts`' `Size` and `Tone`                                                                                                 |
| `@stackra/ui-pro/react`     | every HeroUI Pro web component (66): charts, AI, forms, navigation, overlays, layout, data display and feedback; Pro `Command` is ActionPalette, `FloatingToc` is FloatingTableOfContents |
| `@stackra/ui-pro/native`    | every HeroUI Native Pro component (55): charts, buttons, data display, date and time, forms and navigation; Pro `Fab` is FloatingActionButton                                             |
| `@stackra/ui-pro/node`      | `src/node/ui-pro.module.ts`: the root module                                                                                                                                              |
| `@stackra/ui-pro/css`       | `assets/public/css/ui-pro.css`: the fixes over HeroUI Pro's styles (contrast, the shimmer, Arabic lines), on theme variables only                                                         |
| `@stackra/ui-pro/assets/*`  | static files at the package root (ADR 0234)                                                                                                                                               |

Each component is a thin wrapper: the `@stackra/ui` vocabulary (`size`, `tone`, `isDisabled`, `label`, `onPress`) maps
onto HeroUI Pro's names, every other prop passes through, and the compound parts are HeroUI Pro's own. The web
components are on the playground's "Pro" routes, the native ones in `apps/mobile`'s design-system review area. A
component with nothing in the vocabulary to map (most charts, Markdown, Timeline, Table) keeps HeroUI Pro's API as it is.

## Using it in an app

- Web: `@heroui-pro/react` with its peers (`motion`, `react-resizable-panels`, `recharts` for Kpi), and the styles in
  this order: `@import "tailwindcss"; @import "@heroui/styles"; @import "@heroui-pro/react/css"; @import
"@stackra/ui-pro/css";`, the last outside any `@layer` so it wins over HeroUI Pro's layered rules.
- Native: `heroui-native-pro` (with `@internationalized/date` for Calendar and DatePicker) inside `@stackra/ui`'s
  `DesignSystemProvider`, plus `@import "heroui-native-pro/styles";` and a `@source` line for its `lib` folder.
- Install: a `heroui-pro login` session locally; `HEROUI_AUTH_TOKEN` from Infisical `/ci` in CI. Without it the HeroUI
  Pro packages are empty shells.

## Structure

```text
stackra.config.ts          the member definition: static data (ADR 0295)
assets/                    static files: public/, lang/ (templates/, stubs/, data/ with their first file)
src/
├── config/ui-pro.config.ts   UiProConfig, the deploy-time configuration
├── contracts/             the leaf: ports/, enums/, types/
├── core/                  isomorphic code: services, drivers, errors, functions, schemas, blocks
├── node/                  the module: ui-pro.module.ts and its groups (models/, actions/, queries/, …)
└── testing/               fakes/ and matchers/ for consumers' tests
```

The module groups, and the one home of every kind suffix, are on the docs page `standards/structure` (`pnpm docs`),
generated from `tools/scripts/structure.mjs`. A group folder appears with its first file. `stackra gen` writes `stackra.manifest.json` here on its first run.

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

Run one with `pnpm turbo run <task> --filter=@stackra/ui-pro`.
