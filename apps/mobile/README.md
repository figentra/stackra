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
├── app.tsx                    providers: gestures → HeroUI Native → NavigationContainer (theme + linking)
├── global.css                 Tailwind + Uniwind + HeroUI Native styles
├── navigation/
│   ├── types.ts               every route + params (RootStackParamList, TabParamList, …)
│   ├── linking.ts             deep links: stackra://items/<id> → Item
│   ├── header-options.ts      transparent native-stack headers (Liquid Glass) + large titles
│   ├── root-navigator.tsx     native stack: Tabs, Item (dynamic)
│   └── tab-navigator.tsx      native tab bar (UITabBarController) with one stack per tab
├── screens/                   one file per screen
└── components/ui/             Screen (scroll container), Glass (GlassView with fallback)
```

## Adding a screen

1. Add it to the right param list in `navigation/types.ts` (params are typed there, once).
2. Register it in a navigator (`root-navigator.tsx` for full-screen, a tab stack for in-tab).
3. If it should open from a URL, add its path to `navigation/linking.ts`.
