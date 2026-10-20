# App templates

One folder per app kind (ADR 0126). Every kind ships `package.json` (`@figentra/{{NAME}}`), `turbo.jsonc`
(`tier:app`), `README.md`, `AGENTS.md` (with a `## PII` table), `CHANGELOG.md`, and keeps its source in `src/`.

| Kind          | Pick it for                                                                 | tsconfig preset | Port      |
| ------------- | --------------------------------------------------------------------------- | --------------- | --------- |
| `app:console` | A panel app: Vite + React Router 7 (code-based) + HeroUI, Filament-style     | `vite`          | 3710–3799 |
| `app:mobile`  | iOS/Android: Expo SDK 57, code-based React Navigation, HeroUI Native, Uniwind | `expo`          | Metro     |
| `app:desktop` | Electron, packaged by electron-builder (MR7)                                | `library`       | —         |
| `app:docs`    | A Mintlify documentation site                                               | none            | 3334–3399 |

`app:mobile` is a copy of `apps/mobile`; its name cannot contain `-` (Android package segment). There is no
Next.js kind (B16): web apps are Vite + React Router.
