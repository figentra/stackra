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
│                              direction) → NavigationContainer (theme, linking,
│                              direction)
├── global.css                 Tailwind + Uniwind + HeroUI Native and HeroUI Native Pro styles
├── navigation/
│   ├── types.ts               every route + params (RootStackParamList, TabParamList, SettingsStackParamList, …)
│   ├── linking.ts             deep links: stackra://items/<id> → Item, stackra://design-system[/free|pro/<name>],
│   │                          stackra://search (development builds)
│   ├── header-options.ts      transparent native-stack headers (Liquid Glass) + large titles
│   ├── root-navigator.tsx     native stack: Tabs, Item (dynamic)
│   └── tab-navigator.tsx      native tab bar (UITabBarController) with one stack per tab; the Home stack
│                              also holds the design-system review pages; the bar minimizes on scroll (iOS 26) and
│                              development builds add a Search tab in the search role
├── enums/                     ComponentCategory (the catalogue order), ComponentTier (Free, Pro)
├── screens/                   one file per screen
│   ├── design-system-screen.tsx        index of the review area: scheme + direction switchers, All/Free/Pro filter, list by category
│   ├── design-system-components.ts     the one list (category, tier, title, route, screen) the index and stack read
│   ├── search-screen.tsx               the Search tab: the review area's search, opening pages in the Home tab
│   ├── free/<name>-screen.tsx          one review page per @stackra/ui/native component (tier Free)
│   └── pro/<name>-screen.tsx           one review page per @stackra/ui-pro/native component (tier Pro, badged)
└── components/ui/             Screen (scroll container), Section, Sample, ChoiceGroup, ReviewIcons (the review area's icons),
                               CalendarParts, useInsetSheet (HeroUI inset bottom-sheet props)
```

## Design-system review area

The Home tab (`stackra://design-system`; development builds only, release builds show the Home screen) is the mobile twin of `apps/playground`: switch the colour
scheme (Light, Dark, System) and the direction (English LTR, العربية RTL), then open a component page
(`stackra://design-system/free/<name>` or `stackra://design-system/pro/<name>`). To add a component, add its route to `HomeStackParamList`, its page under
`src/screens/`, and one row to `DESIGN_SYSTEM_COMPONENTS` with its category and tier; the landing, the Search tab and the Home stack read that list.
The index lists one section per category (Foundations to AI, empty ones hidden), Free rows before Pro rows, each
alphabetical, with a "Pro" badge on Pro rows and an All / Free / Pro filter above. Bottom sheets use HeroUI's inset
style through `useInsetSheet()`.

`metro.config.js` reads `@stackra/ui` and `@stackra/ui-pro` as source (the `@stackra/source` condition), resolves the
packages' `#` imports, and pins `react`, `react-native`, HeroUI Native and the other native singletons to this app's
copy, because the workspace packages have their own `node_modules` with the web catalog's React.

## Adding a screen

1. Add it to the right param list in `navigation/types.ts` (params are typed there, once).
2. Register it in a navigator (`root-navigator.tsx` for full-screen, a tab stack for in-tab).
3. If it should open from a URL, add its path to `navigation/linking.ts`.
