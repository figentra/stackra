# @stackra/ui

Stackra Design System components: one component API, contracts shared, HeroUI v3 on web, HeroUI Native and Uniwind on native.

**Tier:** `tier:lib` (`packages/design-system/ui`). Part of the Stackra Design System (ADR 0302), laid out in the
programming model v3 (ADR 0294, 0295).

Every component exists once as a contract (`src/contracts`) and twice as an implementation: `./react` on HeroUI v3,
`./native` on HeroUI Native with Uniwind. The contract is shared; the component code is not (ADR 0165, ADR 0227).
Today the package holds the shared types and the two providers; components follow one at a time.

## Wrap the app

```tsx
// Web: inside the router; the app's CSS imports tailwindcss, @heroui/styles and a @stackra/tokens theme.
import { DesignSystemProvider } from "@stackra/ui/react";

<DesignSystemProvider defaultColorScheme="system" defaultLocale="en">
  <App />
</DesignSystemProvider>;
```

```tsx
// Native: inside GestureHandlerRootView and SafeAreaProvider, as HeroUI Native requires; the Uniwind entry CSS
// imports heroui-native/styles and a @stackra/tokens native theme.
import { DesignSystemProvider } from "@stackra/ui/native";

<DesignSystemProvider locale="ar">
  <App />
</DesignSystemProvider>;
```

`DesignSystemProviderProps` is the same on both runtimes:

| Prop                                                       | Does                                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| `colorScheme`, `defaultColorScheme`, `onColorSchemeChange` | `light`, `dark` or `system` (the default), controlled or uncontrolled    |
| `locale`, `defaultLocale`, `onLocaleChange`                | a BCP 47 locale (default `en`), controlled or uncontrolled               |
| `direction`                                                | `ltr` or `rtl`; derived from the locale with `directionOf` when left out |
| `theme`                                                    | the name of the theme the app loads (default `stackra`)                  |

`useDesignSystem()` returns `colorScheme`, `resolvedColorScheme` (light or dark on screen), `locale`, `direction`,
`theme`, `setColorScheme` and `setLocale`.

- **Web** puts `.dark` / `.light` and `data-theme` on `<html>` (HeroUI v3's switch), follows `prefers-color-scheme`
  while the scheme is `system`, sets `lang` and `dir`, and wraps the app in React Aria's `I18nProvider`
  (`react-aria-components`, the version HeroUI 3.2.6 uses), which HeroUI components read. React Aria takes its
  direction from the locale alone, so when `direction` contradicts the locale it is given the locale with a script of
  that direction (`ar` read left to right is `ar-Latn`), and arrow keys follow the document's `dir`.
- **Native** calls `Uniwind.setTheme` in a layout effect, before the first frame is shown (Uniwind follows the system
  for `system`), reads the resolved theme back with
  `useUniwind`, scopes the layout direction with Uniwind's `LayoutDirection` and passes `config.isRTL` to
  `HeroUINativeProvider`. App-wide native RTL (navigation, system views) follows React Native's `I18nManager`, which
  changes only through `I18nManager.forceRTL` and an app restart; the provider never forces it.

## Entry points

| Import                  | Holds                                                                                                   | Exports today                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `@stackra/ui`           | `src/config/` and `src/core/`: `UiConfig`, `directionOf`                                                | `src/core/index.ts` (stand-in)        |
| `@stackra/ui/contracts` | `Size`, `Tone`, `Variant`, `ColorScheme`, `Direction`, `DesignSystemProviderProps`, `DesignSystemState` | `src/contracts/index.ts` (stand-in)   |
| `@stackra/ui/react`     | `DesignSystemProvider`, `useDesignSystem` on HeroUI v3                                                  | `src/react/index.ts` (stand-in)       |
| `@stackra/ui/native`    | `DesignSystemProvider`, `useDesignSystem` on HeroUI Native and Uniwind                                  | `src/native/index.ts` (stand-in)      |
| `@stackra/ui/node`      | `UiModule`, the root module                                                                             | `src/node/ui.module.ts`               |
| `@stackra/ui/testing`   | `src/testing/`: `fakes/` and `matchers/`                                                                | not yet: exported with its first file |
| `@stackra/ui/assets/*`  | `assets/`: static files (`public/`, `lang/`, …) at the package root (ADR 0234)                          | not yet: exported with its first file |

The stand-in barrels are replaced when `stackra gen` writes the entry barrels (STA-339). `exports` point at source
through the `@stackra/source` condition; `tsdown` builds `dist/` for publishing (ADR 0025).

The UI libraries are optional peer dependencies, each needed only by its entry: `react-aria-components` for `./react`
(and `@heroui/react` for its components), `heroui-native`, `uniwind` and `react-native` for `./native`. `react` is
needed by both.

## Contracts

The shared values are frozen tuples with a type of the same name, verified against HeroUI v3 (`@heroui/styles`
3.2.6) and HeroUI Native 1.0.10: `Size` (`sm`, `md`, `lg`), `Tone` (`default`, `accent`, `success`, `warning`,
`danger`, HeroUI's colour roles), `Variant` (`primary`, `secondary`, `tertiary`, the variants both runtimes share; a
component adds its own), `ColorScheme` (`light`, `dark`, `system`) and `Direction` (`ltr`, `rtl`).

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

Run one with `pnpm turbo run <task> --filter=@stackra/ui`. Components are reviewed in `apps/playground`.
