# @figentra/mobile

Stackra's iOS and Android app: Expo SDK 57 with **code-based** React Navigation (no `app/` folder, no expo-router),
HeroUI Native + Uniwind for UI, and iOS 26 Liquid Glass from native components.

| Command                                        | Does                                                          |
| ---------------------------------------------- | ------------------------------------------------------------- |
| `pnpm dev`                                     | Start Metro (`expo start`)                                    |
| `pnpm ios` / `pnpm android`                    | Build a dev client and run it (Xcode / Android Studio needed) |
| `pnpm build`                                   | `expo export` iOS + Android bundles to `dist/`                |
| `pnpm typecheck` / `pnpm lint` / `pnpm format` | The usual checks                                              |
| `pnpm doctor`                                  | `expo install --check` — native versions match the SDK        |

## Structure

```text
src/
├── main.ts                    registerRootComponent(App)
├── app.tsx                    providers: gestures → safe area → DesignSystemProvider (HeroUI Native, scheme,
│                              direction) → NavigationContainer (theme + linking)
├── global.css                 Tailwind + Uniwind + HeroUI Native and HeroUI Native Pro styles
├── navigation/
│   ├── types.ts               every route + params (RootStackParamList, TabParamList, SettingsStackParamList, …)
│   ├── linking.ts             deep links: stackra://items/<id> → Item, stackra://design-system[/pro/<name>]
│   ├── header-options.ts      transparent native-stack headers (Liquid Glass) + large titles
│   ├── root-navigator.tsx     native stack: Tabs, Item (dynamic)
│   └── tab-navigator.tsx      native tab bar (UITabBarController) with one stack per tab; the Settings stack
│                              also holds the design-system review pages
├── screens/                   one file per screen
│   ├── design-system-screen.tsx        index of the review area: scheme + direction switchers, grouped list
│   ├── design-system-components.ts     the one list (group, title, route, screen) the index and stack read
│   └── pro/<name>-screen.tsx           one review page per @stackra/ui-pro/native component
└── components/ui/             Screen (scroll container), Glass (GlassView with fallback), Section, ChoiceGroup,
                               CalendarParts
```

## Design-system review area

Settings → Design system (`stackra://design-system`) is the mobile twin of `apps/playground`: switch the colour
scheme (Light, Dark, System) and the direction (English LTR, العربية RTL), then open a component page
(`stackra://design-system/pro/<name>`). To add a component, add its route to `SettingsStackParamList`, its page under
`src/screens/`, and one row to `DESIGN_SYSTEM_COMPONENTS`; the index and the Settings stack read that list.

`metro.config.js` reads `@stackra/ui` and `@stackra/ui-pro` as source (the `@stackra/source` condition), resolves the
packages' `#` imports, and pins `react`, `react-native`, HeroUI Native and the other native singletons to this app's
copy, because the workspace packages have their own `node_modules` with the web catalog's React.

## Adding a screen

1. Add it to the right param list in `navigation/types.ts` (params are typed there, once).
2. Register it in a navigator (`root-navigator.tsx` for full-screen, a tab stack for in-tab).
3. If it should open from a URL, add its path to `navigation/linking.ts`.
