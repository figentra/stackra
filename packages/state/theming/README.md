# @stackra/theming

Stackra theming: the colour scheme a user chooses (light, dark or system), kept per device and resolved against the
system preference, and the look of a member (`ThemingConfig`) over the themes of `@stackra/tokens`.

**Tier:** `tier:lib` (`packages/state/theming`). Entries `.`, `./contracts`, `./browser`, `./react`, `./native` and
`./testing`. Depends on `@stackra/contracts`, `@stackra/container`, `@stackra/config`, `@stackra/validation`,
`@stackra/storage`, `@stackra/tokens`, `@stackra/ui` (for `ColorScheme`), `@stackra/assets` (a type) and zod; React
and React Native are optional peers.

## What is here

| Entry         | Symbol                              | Use                                                                                      |
| ------------- | ----------------------------------- | ---------------------------------------------------------------------------------------- |
| `.`           | `ColorScheme`                       | `light`, `dark`, `system`; declared in `@stackra/ui/contracts`, re-exported here         |
| `.`           | `ThemingConfig`, `ThemingConfig$`   | key `theming`: theme, logo, schemes, default scheme, theme colour, splash, fonts, tenant |
| `.`           | `ThemingOptions`                    | the shape of the configuration                                                           |
| `.`           | `SchemeColors`, `Splash`            | the types of `themeColor` and `splash`                                                   |
| `.`           | `ColorSchemeService`                | the chosen scheme: reads and writes it in `prefs`, resolves `system`, notifies           |
| `.`           | `ColorSchemeState`                  | `{ scheme, resolved, setScheme }`, what `useColorScheme()` returns                       |
| `.`           | `MemorySystemColorSchemeDriver`     | the `memory` driver of `SystemColorScheme` (server renders, tests)                       |
| `./contracts` | `SystemColorScheme`                 | the port: the system's light or dark preference and its changes                          |
| `./browser`   | `BrowserSystemColorSchemeDriver`    | the `browser` driver: `prefers-color-scheme`                                             |
| `./native`    | `AppearanceSystemColorSchemeDriver` | the `appearance` driver: React Native's `Appearance`                                     |
| `./react`     | `useColorScheme`                    | the scheme and its setter in a component, on web and native alike                        |
| `./testing`   | `fakeColorScheme`                   | a seeded `ColorSchemeService` for a test                                                 |

## Overriding the look

```ts
// apps/mobile/src/config/theming.config.ts
import { ColorScheme, ThemingConfig as BaseThemingConfig } from "@stackra/theming";

export class ThemingConfig extends BaseThemingConfig {
  override theme = "acme";
  override logo = "mobile::public/logo.svg";
  override schemes: ColorScheme[] = [ColorScheme.Light, ColorScheme.Dark, ColorScheme.System];
  override defaultScheme: ColorScheme = ColorScheme.System;
  override splash = { ...this.splash, background: { light: "#f7f7f5", dark: "#1c1e22" } };
}
```

The defaults are the `stackra` theme, no logo, every scheme with `system` first, the theme's background as theme and
splash colour, self-hosted fonts and no tenant colours. `logo` is an asset key or a generated asset entry. Colours
are `#RRGGBB` or `#RRGGBBAA`, because the native splash and the web manifest cannot read CSS. `defaultScheme` must be
one of `schemes`; the service refuses to start otherwise.

A native app follows the phone's appearance live by default (`defaultScheme = "system"`), and the scheme toggle is the
in-app override. An app that must stay in one scheme offers only that one: an always-dark brand sets
`schemes = ["dark"]` and `defaultScheme = "dark"`, an always-light till the same with `light`.

`maxFontScale` caps the device's text size for dense screens (a till, a kitchen display); `null`, the default, follows
Dynamic Type on iOS and the font scale on Android with no cap. It is at least 1, and there is no in-app text-size
setting. The generated root passes it to `DesignSystemProvider`.

## Reading and choosing the scheme

```tsx
const scheme = useColorScheme();
const isDark = scheme.resolved === ColorScheme.Dark;
<Button onPress={() => scheme.setScheme(isDark ? ColorScheme.Light : ColorScheme.Dark)} />;
```

`ColorSchemeService` keeps the choice in the `prefs` area of `@stackra/storage` under `theming.scheme`, so it stays
on the device and never reaches the server. A stored value the configuration does not offer reads as the default.
While the choice is `system`, `resolved` follows the `SystemColorScheme` driver of the target: `browser` on the web,
`appearance` on a device, `memory` on a server. A server render and a hydrating client show the default scheme
(`system` as light), so hydration never mismatches; the device's choice follows right after.

Applying the scheme to the screen (`data-theme` and the `.dark` class on the web, Uniwind and `Appearance` on a
device) is the job of `@stackra/ui`'s `DesignSystemProvider`, which the generated root mounts with this service's
scheme and the configured theme. Apps write no theme provider.

## Accessibility settings

```tsx
const { reduceMotion, boldText, highContrast, fontScale } = useAccessibility();
const duration = reduceMotion ? 0 : 240;
```

The app always follows the system's Reduce Motion, Bold Text, high contrast and text size, and never overrides them,
so the hook has no setter. It reads the `SystemAccessibility` driver of the target: `accessibility-info` on a device
(`AccessibilityInfo` and `PixelRatio`; Darker Colors on iOS and high-contrast text on Android both read as
`highContrast`), `browser` on the web (`prefers-reduced-motion`, `prefers-contrast`; `boldText` false and `fontScale`
1, because the browser scales text itself), `memory` on a server and in tests. A server render shows
`DEFAULT_ACCESSIBILITY_SETTINGS`. Design system components already follow these settings on their own (HeroUI Native and
Reanimated under reduce motion, the web stylesheet's media queries); the hook is for code that animates or lays out in
JavaScript.

## Strings

`assets/lang/{en,ar}/theming.json` hold the `theming::enums.color_scheme.*` labels gen copies into each app.

## Testing

```ts
const colorScheme = fakeColorScheme({ scheme: ColorScheme.System, system: "dark" });
const app = await createTestingModule(AppModule)
  .override(ColorSchemeService, colorScheme)
  .compile();
```

The fake is a real service over memory storage and the memory system driver. For accessibility, bind a
`MemorySystemAccessibilityDriver` and change it with `set({ reduceMotion: true, fontScale: 1.5 })`.
