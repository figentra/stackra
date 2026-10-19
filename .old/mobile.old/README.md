# @stackra/mobile

The Stackra mobile app: Expo SDK 57, expo-router native tabs (iOS 26 Liquid Glass), HeroUI Native and Uniwind.

## Tasks

| Script                              | Does                                       |
| ----------------------------------- | ------------------------------------------ |
| `pnpm dev`                          | `expo start` (`pnpm mobile` from the root) |
| `pnpm ios` / `pnpm android`         | Build and run a dev client                 |
| `pnpm typecheck`                    | `tsc --noEmit`                             |
| `pnpm lint`                         | `oxlint .`                                 |
| `pnpm format` / `pnpm format:check` | `oxfmt` write / check                      |
| `pnpm doctor`                       | `expo install --check`                     |
| `pnpm clean`                        | Remove `.expo`, `ios`, `android`, `.turbo` |

## Structure

```
src/
  app/          expo-router routes
  components/   app components
  global.css    Uniwind / Tailwind entry
```

## Run

`pnpm install` at the repo root, then `pnpm mobile`.
