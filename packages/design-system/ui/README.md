# @stackra/ui

Stackra Design System components: one component API, contracts shared, HeroUI v3 on web, HeroUI Native and Uniwind on native.

**Tier:** `tier:lib` (`packages/design-system/ui`). Part of the Stackra Design System (ADR 0302), laid out in the
programming model v3 (ADR 0294, 0295).

Every component exists once as a contract (`src/contracts`) and twice as an implementation: `./react` on HeroUI v3,
`./native` on HeroUI Native with Uniwind. The contract is shared; the component code is not (ADR 0165, ADR 0227).
Today the package holds the shared types, the two providers and the first components (`Icon`, `Text`, `Heading`, `Button`, `IconButton`, `CloseButton`, `Link`, `Surface`, `Card`, `Separator`, `Chip`, `StatusBadge`, `Badge`, `Avatar`, `Spinner`, `Skeleton`, `SkeletonGroup`);
the rest of the catalogue follows one at a time (ADR 0303).

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

| Import                  | Holds                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Exports today                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `@stackra/ui`           | `src/config/` and `src/core/`: `UiConfig`, `directionOf`, `ICON_SIZES`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | `src/core/index.ts` (stand-in)        |
| `@stackra/ui/contracts` | `Size`, `Tone`, `Variant`, `ColorScheme`, `Direction`, `DesignSystemProviderProps`, `DesignSystemState`, `TextTone`, `TextType`, `TextAlign`, `HeadingType`, `HeadingLevel`, `IconComponent`, `IconComponentProps`, `IconContractProps`, `TypographyContractProps`, `TextContractProps`, `HeadingContractProps`, `SurfaceVariant`, `SeparatorVariant`, `Orientation`, `ChipVariant`, `BadgeVariant`, `BadgePlacement`, `AvatarVariant`, `AvatarShape`, `SkeletonAnimation` and the `Surface`, `Card`, `CardTitle`, `Separator`, `Chip`, `StatusBadge`, `Badge`, `BadgeAnchor`, `Avatar`, `Spinner`, `Skeleton` and `SkeletonGroup` contract props | `src/contracts/index.ts` (stand-in)   |
| `@stackra/ui/react`     | `DesignSystemProvider`, `useDesignSystem`, `Icon`, `Text`, `Heading`, `Surface`, `Card`, `Separator`, `Chip`, `StatusBadge`, `Badge`, `Avatar`, `Spinner`, `Skeleton`, `SkeletonGroup` (and their `*Props`) on HeroUI v3                                                                                                                                                                                                                                                                                                                                                                                                                          | `src/react/index.ts` (stand-in)       |
| `@stackra/ui/native`    | `DesignSystemProvider`, `useDesignSystem`, `Icon`, `Text`, `Heading`, `Surface`, `Card`, `Separator`, `Chip`, `StatusBadge`, `Badge`, `Avatar`, `Spinner`, `Skeleton`, `SkeletonGroup` (and their `*Props`) on HeroUI Native and Uniwind                                                                                                                                                                                                                                                                                                                                                                                                          | `src/native/index.ts` (stand-in)      |
| `@stackra/ui/node`      | `UiModule`, the root module                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `src/node/ui.module.ts`               |
| `@stackra/ui/testing`   | `src/testing/`: `fakes/` and `matchers/`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | not yet: exported with its first file |
| `@stackra/ui/assets/*`  | `assets/`: static files (`public/`, `lang/`, …) at the package root (ADR 0234)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | not yet: exported with its first file |

The stand-in barrels are replaced when `stackra gen` writes the entry barrels (STA-339). `exports` point at source
through the `@stackra/source` condition; `tsdown` builds `dist/` for publishing (ADR 0025).

The UI libraries are optional peer dependencies, each needed only by its entry: `react-aria-components` and
`lucide-react` for `./react` (and `@heroui/react` for its components), `heroui-native`, `uniwind`,
`lucide-react-native` and `react-native` for `./native` (the native provider mounts a `LucideProvider`, so
`lucide-react-native` is needed by the whole entry). `react` is needed by both.

## Contracts

The shared values are frozen tuples with a type of the same name, verified against HeroUI v3 (`@heroui/styles`
3.2.6) and HeroUI Native 1.0.10: `Size` (`sm`, `md`, `lg`), `Tone` (`default`, `accent`, `success`, `warning`,
`danger`, HeroUI's colour roles), `Variant` (`primary`, `secondary`, `tertiary`, the variants both runtimes share; a
component adds its own), `ColorScheme` (`light`, `dark`, `system`) and `Direction` (`ltr`, `rtl`).

Text and Heading add `TextTone` (the shared tones plus `muted`), `TextType` (`body`, `small`, `caption`, the theme's
token names), `TextAlign`, `HeadingType` (`h1` to `h6`) and `HeadingLevel` (1 to 6).

## Icons

`Icon` draws a Lucide icon, or any component that takes `size`, `color` and `strokeWidth`, at a Stackra size and in a
theme colour. There is no icon name string: pass the component (`<Icon as={ChevronRight} />`).

| Prop              | Does                                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| `as`              | the icon component to draw (required)                                                                    |
| `size`            | `sm` 16 px, `md` 20 px (the default) or `lg` 24 px; left out inside a holder, it takes the holder's size |
| `tone`            | a colour role, `TextTone`; left out, the icon takes the colour of its surroundings                       |
| `label`           | what the icon means; left out or empty the icon is decorative and hidden from assistive technology       |
| `isMirroredInRtl` | draw it mirrored in right-to-left text: arrows, chevrons and other icons that point the reading way      |

Every other SVG prop passes through. Mirror an icon that points along the reading line (`ChevronRight`, `ArrowRight`,
`SendHorizontal`, `Undo2`, `ExternalLink`, `LogIn`, `LogOut`); never one that depicts an object, a check, time or
media (`Check`, `Search`, `Plus`, `Clock`, `Play`, `Heart`, `Star`, logos). Do not also swap the component by direction.

An icon slot of another component (`icon`, `startIcon`, `endIcon`) takes any React element, so an app can pass another
set. Web hosts size and colour icons with CSS; native hosts wrap the slot in `LucideProvider` with size and colour
together, because a nested provider replaces rather than merges. The native `DesignSystemProvider` mounts a root
`LucideProvider` (`md`, the theme's foreground), so a bare icon draws correctly outside any host.

## Text and Heading

`Text` and `Heading` are thin wrappers over HeroUI Typography (`Typography` on web, `Typography.Paragraph` and
`Typography.Heading` on native). The type scale is the theme's: `@stackra/tokens` restyles HeroUI's own classes, so the
wrappers add no styles.

| Prop          | On      | Does                                                                                                    |
| ------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| `type`        | Text    | `body` (the default), `small` or `caption`: the theme's tokens, HeroUI's `body`, `body-sm`, `body-xs`   |
| `level`       | Heading | 1 to 6, required: the outline level and the web element (`h<level>`); React Native has no levels        |
| `type`        | Heading | `h1` to `h6`, the look; defaults to the level's, so a level-3 heading can be drawn as `h1`              |
| `tone`        | both    | `default`, `muted`, `accent`, `success`, `warning`, `danger`                                            |
| `align`       | both    | `start` (the default), `center`, `end`, `justify` (iOS only on native)                                  |
| `isTruncated` | both    | one line with an ellipsis; assistive technology still reads all of it                                   |
| `lang`        | both    | the language of this text when it differs from the screen's; Arabic text takes the theme's `-ar` styles |

HeroUI's other props pass through (`weight`, `className`, `id`, `render` on web Text, `numberOfLines` on native);
HeroUI's `color` and `truncate` are refused by the type, as they are `tone` and `isTruncated`.

- **Arabic.** The web theme restyles with `:where(:lang(ar))`, so an Arabic page and a single `<Text lang="ar">` both
  get the `-ar` style. On native, Text and Heading add the theme's `type-<token>-ar` class when `lang`, or the
  provider's locale, is Arabic; they read the locale with `useDesignSystem()`, so they sit inside the native
  `DesignSystemProvider`. Other Arabic-script languages are not covered yet.
- **Scanning.** The tone colours (`text-danger`, ...) are utility classes in this package's source, which Tailwind
  (web) and Uniwind (native) do not scan by themselves. Each app adds one `@source` line next to its other
  sources, for example `@source "../../node_modules/@stackra/ui/src";` (relative to the CSS file).
- **Native fonts.** Native draws the theme's sizes in the system font until the native font families are added.

## Buttons

`Button`, `IconButton` and `CloseButton` are thin wrappers over HeroUI's own buttons (`Button` and `CloseButton` on
web, `Button` and `CloseButton` on native). Every HeroUI prop the contract does not name passes through, the native
press feedback (`feedbackVariant`, `animation`, `background`) included; the look is HeroUI's, themed by the tokens.

| Prop                   | Does                                                                                                          | HeroUI v3 (web) | HeroUI Native                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- | --------------- | ----------------------------------- |
| `variant`              | `primary` (default), `secondary`, `tertiary`, `outline`, `ghost`, `danger`, `danger-soft`; there is no `tone` | `variant`       | `variant`                           |
| `size`                 | `sm`, `md` (default), `lg`                                                                                    | `size`          | `size`                              |
| `isDisabled`           | refuse presses and show the disabled style                                                                    | `isDisabled`    | `isDisabled`                        |
| `isLoading`            | refuse presses, show a spinner in place of the start icon, keep focus                                         | `isPending`     | `disabled`, `busy` state, `Spinner` |
| `isFullWidth`          | stretch to the container                                                                                      | `fullWidth`     | the `w-full` class                  |
| `startIcon`, `endIcon` | any element on the inline-start or inline-end side                                                            | children        | children                            |
| `label`                | the accessible name when it must differ from the text; required on `IconButton` and `CloseButton`             | `aria-label`    | `accessibilityLabel`                |
| `onPress`              | called on press by pointer, touch or keyboard                                                                 | `onPress`       | `onPress`                           |

An icon-only button is always an `IconButton` (`icon`, required `label`), so it always has a name; `isIconOnly` is
not a `Button` prop. `CloseButton` takes a required `label` too, because HeroUI's web default is the English
"Close" and its native one is none; `icon` replaces HeroUI's close mark. While loading, the web spinner is hidden from
assistive technology so the name stays the label, and React Aria announces the pending state. On native the content
sits in a `LucideProvider`, so a Lucide icon in a slot draws in the label's size and colour.

Directional icons in a button are the caller's choice: `<Icon as={ChevronRight} isMirroredInRtl />`.

## Link and the router

`Link` is a text link: HeroUI v3's `Link` on web, HeroUI Native's `LinkButton` on native (which has no link of its
own, so the native form is the documented adaptation on that free part).

| Prop            | Does                                                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `href`          | an app path for the router, or an absolute URL (`https:`, `mailto:`, `tel:`)                                                       |
| `onPress`       | called first, then the link follows `href`                                                                                         |
| `isDisabled`    | inert and announced as disabled                                                                                                    |
| `isExternal`    | a new tab (web) or the system browser (native), with the external mark and a spoken hint; never inferred from `href`               |
| `tone`          | `default` (the theme's link colour), `accent`, `success`, `warning`, `danger`                                                      |
| `underline`     | `always` (the default; the stackra link colour equals the text colour, so a link in text needs it) or `hover` for standalone links |
| `label`         | the accessible name of an icon-only link                                                                                           |
| `externalLabel` | what assistive technology hears for an external link                                                                               |

`Link` imports no router. On web, `@stackra/ui/react` re-exports React Aria's `RouterProvider`
(`navigate`, `useHref`): an internal, same-origin, unmodified click is a client navigation, everything else is the
browser's. On native, `@stackra/ui/native` ships its own `RouterProvider` with `navigate(href)` only, which
`@stackra/navigation` binds to React Navigation; without one an app path opens in the system browser. A link inside
running native text belongs to `Text` later.

## Surfaces

`Surface`, `Card` and `Separator` are thin wrappers over HeroUI's own (`Surface`, `Card` and `Separator` on web and on
native). Every HeroUI prop the contract does not name passes through; the look is HeroUI's, themed by the tokens.

| Component    | Prop          | Does                                                                                       | HeroUI v3 (web)                | HeroUI Native                          |
| ------------ | ------------- | ------------------------------------------------------------------------------------------ | ------------------------------ | -------------------------------------- |
| `Surface`    | `variant`     | `default` (the default), `secondary`, `tertiary`, `transparent`: the theme's surface level | `variant`                      | `variant`                              |
| `Card`       | `variant`     | the same four levels; `transparent` drops the background and shadow                        | `variant`                      | `variant`                              |
| `Card`       | parts         | `Card.Header`, `Card.Title`, `Card.Description`, `Card.Content`, `Card.Footer`             | the same, `Card.Root` left out | `Card.Content` is `Card.Body`          |
| `Card.Title` | `level`       | the heading level in the outline, 1 to 6, default 3; the look stays the card title's       | `h<level>` through `render`    | `accessibilityRole="header"`, no level |
| `Separator`  | `orientation` | `horizontal` (the default) or `vertical`                                                   | `orientation`                  | `orientation`                          |
| `Separator`  | `variant`     | the colour level for the surface it sits on: `default`, `secondary`, `tertiary`            | `variant`                      | painted with `useThemeColor`           |

- **Looks differ by runtime, on purpose.** HeroUI's web surface paints colour only (add padding and radius with
  `className`); HeroUI Native's is a padded, rounded, ringed box. A chrome-free native surface is
  `className="p-0 rounded-none shadow-none"` at the call site.
- **A card is a container.** It takes no press; put a link or a button inside. Name it for assistive technology with
  `role="article"` and `aria-labelledby` pointing at its title (web), or `accessibilityLabel` (native). A native footer
  is a column: add `className="flex-row"` for a row of actions.
- **A separator does not read its level from the surface around it**; pass `variant`. On native, HeroUI Native's own
  `thin` and `thick` are gone from the type: `thickness` stays, and `thickness={6}` is its `thick`. A web rule is an
  `hr` or a vertical `role="separator"`; native rules are not announced. For a purely decorative web rule use
  `render={(props) => <hr {...props} aria-hidden="true" />}`.

## Chip and StatusBadge

`Chip` is a compact, non-interactive label: HeroUI's `Chip` on both runtimes. It is display only (no press, no
`isDisabled`, no remove button); use a tag group for selectable or removable tags and a `Button` for an action.
`StatusBadge` has no HeroUI component, so it is the documented adapted form on `Chip`: a neutral chip with a 6 px dot.

| Prop                   | On   | Does                                                                                                    | HeroUI v3 (web) | HeroUI Native                   |
| ---------------------- | ---- | ------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------- |
| `variant`              | Chip | `primary`, `secondary` (the default), `tertiary`, `soft`                                                | `variant`       | `variant` (default `primary`)   |
| `tone`                 | both | `default` (the default), `accent`, `success`, `warning`, `danger`; the dot's colour only on StatusBadge | `color`         | `color` (default `accent`)      |
| `size`                 | both | `sm`, `md` (the default), `lg`                                                                          | `size`          | `size`                          |
| `startIcon`, `endIcon` | Chip | any element, drawn in the text's size                                                                   | children        | children, in a `LucideProvider` |

Both runtimes draw the same chip with no props (`secondary`, `default`, `md`): HeroUI Native's own defaults are
overridden. A string or number child is the label. A status badge reads as its text alone and is never a live region:
a screen that changes a status while the user is watching announces it with a toast.

## Badge

`Badge` is a count or dot pinned to a corner of another element, as `<Badge.Anchor>` holding the element and then the
`Badge`. HeroUI v3's `Badge` on web; HeroUI Native has none, so the native form is the documented adaptation on its
`Chip`, drawn at the web badge's sizes and pinned with React Native's logical `start` and `end` sides.

| Prop        | Does                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `children`  | the text, number or icon, already formatted (`99+`); left out, the badge is a dot                             |
| `tone`      | `default` (the default), `accent`, `success`, `warning`, `danger`                                             |
| `variant`   | `primary` (the default), `secondary`, `soft`                                                                  |
| `size`      | `sm`, `md` (the default), `lg`                                                                                |
| `placement` | `top-end` (the default), `top-start`, `bottom-end`, `bottom-start`: by reading direction, never by side       |
| `label`     | what assistive technology says; left out, the badge is hidden from it (name the count on the control instead) |

A badge never takes a press: it overlaps its anchor, so presses reach the anchor. It is never a live region.

## Avatar

`Avatar` draws an image, else your `fallback`, else the initials of `name`, else a person icon (Lucide `UserRound`).
HeroUI v3 and HeroUI Native both have one, so each wrapper is thin; `initialsOf(name, locale)` is exported from `.`
for anything else that draws initials (an Arabic-script name gives one letter, because two would join).

| Prop       | Does                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| `name`     | the name its initials come from                                                                        |
| `src`      | the image URL; the fallback shows when it is missing or fails to load                                  |
| `label`    | the accessible name; left out, the avatar is hidden from assistive technology (the name is nearby)     |
| `size`     | `sm`, `md` (the default), `lg`: each runtime keeps HeroUI's pixels (web 32, 40, 48; native 40, 48, 64) |
| `tone`     | `default` (the default, not HeroUI Native's `accent`), `accent`, `success`, `warning`, `danger`        |
| `variant`  | `default` (a neutral disc) or `soft` (the tone's soft colour)                                          |
| `shape`    | `circle` (the default) or `square` for organisations: one `rounded-lg` class                           |
| `fallback` | an element drawn instead of the initials, sized and coloured like them                                 |

While an image loads, web shows the fallback and native shows only the background (HeroUI's own behaviour).

## Spinner

`Spinner` is an indeterminate wait at 16, 24 or 32 px on both runtimes (HeroUI web's `xl` is left out). Render it
while something loads and remove it after; there is no `isLoading`.

| Prop    | Does                                                                                                              |
| ------- | ----------------------------------------------------------------------------------------------------------------- |
| `size`  | `sm`, `md` (the default), `lg`                                                                                    |
| `tone`  | `accent` (the default, HeroUI's), `default` (the foreground colour), `muted`, `success`, `warning`, `danger`      |
| `label` | the spoken name, one status (web `status`, native busy `progressbar`); left out, it is hidden from screen readers |

HeroUI web's English "Loading" never reaches a user. Speed is a web `className` animation utility; native has none.

## Skeleton and SkeletonGroup

`Skeleton` is a placeholder whose shape and size are its `className` (`h-4 w-3/4 rounded-md` draws the same bone on both
runtimes). It shows while `isLoading` (default `true`) and renders its `children` once false. Inside a `SkeletonGroup`
it takes the group's `isLoading` and `animationType` unless it sets its own. HeroUI v3 has no group, so the web one is the
documented adapted form: HeroUI's single-shimmer class plus a context, one sweep over every bone.

| Prop            | On                   | Does                                                                                       |
| --------------- | -------------------- | ------------------------------------------------------------------------------------------ |
| `isLoading`     | both                 | the placeholder until false                                                                |
| `animationType` | both                 | `shimmer` (the default), `pulse`, `none` (native's `variant`, which is emphasis elsewhere) |
| `loadingLabel`  | `SkeletonGroup` only | the spoken text of the loading region (web `status`, native one busy progressbar)          |

A lone bone is an empty box and is never read; name the region with the group. On native, HeroUI hands every group
prop but `className` and `style` to each Skeleton, and a Skeleton refuses `onLayout` (HeroUI measures the shimmer with
its own). The web theme stops the sweep and the pulse under reduced motion and sweeps from the inline-start side.

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
