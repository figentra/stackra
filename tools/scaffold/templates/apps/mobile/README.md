# @figentra/{{NAME}}

{{DESCRIPTION}} Expo SDK 57 with **code-based** React Navigation (no `app/` folder, no expo-router),
HeroUI Native + Uniwind for UI, and iOS 26 Liquid Glass from native components.

| Command                                        | Does                                                          |
| ---------------------------------------------- | ------------------------------------------------------------- |
| `pnpm dev`                                     | Start Metro (`expo start`)                                    |
| `pnpm ios` / `pnpm android`                    | Build a dev client and run it (Xcode / Android Studio needed) |
| `pnpm build`                                   | `expo export` iOS + Android bundles to `dist/`                |
| `pnpm typecheck` / `pnpm lint` / `pnpm format` | The usual checks                                              |
| `pnpm doctor`                                  | `expo install --check` — native versions match the SDK        |

## Structure

The programming model v3 shape (ADR 0294 rule R12, decision 14). Files marked stand-in are what gen writes once it
ships (STA-339); keep them thin.

```text
stackra.config.ts              the app definition: targets, area, name, scheme (ADR 0295)
app.json, eas.json             stand-ins: gen writes the Expo and EAS config from stackra.config.ts
src/
├── {{NAME}}.module.ts         the root module
├── main.ts                    stand-in entry: registerRootComponent(App)
├── app.tsx                    stand-in shell: gestures → HeroUI Native → NavigationContainer (theme + linking)
├── config/chrome.config.ts    {{PASCAL}}ChromeConfig: status bar and tab bar (ADR 0295 decision 11)
├── routes/<name>/             <name>.route.ts (path) and <name>.tsx (page): home, item, settings
├── navigation/                stand-in navigators, linking and param types, built from the routes
├── components/<name>/         <name>.tsx and index.ts: screen (scroll container)
└── styles/global.css          Tailwind + Uniwind + HeroUI Native styles
```

## Adding a screen

1. Add `src/routes/<name>/<name>.route.ts` (its path) and `<name>.tsx` (its page).
2. Add it to the right param list in `navigation/types.ts`, register it in a navigator (`root-navigator.tsx` for
   full-screen, a tab stack for in-tab) and, if it opens from a URL, add its path to `navigation/linking.ts`. Gen
   does this step once it ships.
