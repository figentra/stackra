# App templates

One folder per app kind (ADR 0126). Every kind ships `package.json` (`@figentra/{{NAME}}`), `turbo.jsonc`
(`tier:app`), `README.md`, `AGENTS.md` (with a `## PII` table), `CHANGELOG.md`, and keeps its source in `src/`.

`app:console`, `app:mobile` and `app:desktop` come out in the programming model v3 shape (ADR 0294 rule R12, decision
14): `stackra.config.ts`, the root module `src/{{NAME}}.module.ts`, routes as `routes/<name>/` folders, components as
`components/<name>/` folders, config classes in `config/` (`chrome.config.ts` in mobile) and styles in `styles/`.
Their runtime entry (`main.ts(x)`), the mobile shell and navigators, and the tool files (`index.html`, Vite, Expo,
EAS, Metro, tsdown, electron-builder) stay authored stand-ins, each marked `shortcut:`, until gen writes them into
`.stackra/` (ADR 0295, STA-339): their build tools need them today. `app:docs` is exempt from R12 (Mintlify).

| Kind          | Pick it for                                                                 | tsconfig preset | Port      |
| ------------- | --------------------------------------------------------------------------- | --------------- | --------- |
| `app:console` | A panel app: Vite + React Router 7 (code-based) + HeroUI, Filament-style     | `vite`          | 3710–3799 |
| `app:mobile`  | iOS/Android: Expo SDK 57, code-based React Navigation, HeroUI Native, Uniwind | `expo`          | Metro     |
| `app:desktop` | Electron, packaged by electron-builder (MR7)                                | `library`       | —         |
| `app:docs`    | A Mintlify documentation site                                               | none            | 3334–3399 |

`app:mobile` is a copy of `apps/mobile`; its name cannot contain `-` (Android package segment). There is no
Next.js kind (B16): web apps are Vite + React Router.
