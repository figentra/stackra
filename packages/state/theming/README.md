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

## Strings

`assets/lang/{en,ar}/theming.json` hold the `theming::enums.color_scheme.*` labels gen copies into each app.

## Testing

```ts
const colorScheme = fakeColorScheme({ scheme: ColorScheme.System, system: "dark" });
const app = await createTestingModule(AppModule)
  .override(ColorSchemeService, colorScheme)
  .compile();
```

The fake is a real service over memory storage and the memory system driver.
