# App templates

One folder per app kind. The scaffold copies a kind into `apps/<name>/`, copies the root `LICENSE` beside it and
replaces five tokens: `{{NAME}}` (kebab, e.g. `admin`), `{{PASCAL}}`, `{{TITLE}}` (e.g. "Admin"),
`{{DESCRIPTION}}` and `{{PORT}}`. Replace only these exact tokens — JSX sources contain other `{{ … }}` text
(`style={{ flex: 1 }}`). Every kind ships `package.json` (`@stackra/{{NAME}}`), `turbo.json` (`tier:app`),
`README.md`, `AGENTS.md` (with a `## PII` table), `CHANGELOG.md`, and keeps its source in `src/`.

| Kind   | Pick it for                                                              | tsconfig preset | Scripts                                                                                       | Copied from    |
| ------ | ------------------------------------------------------------------------ | --------------- | --------------------------------------------------------------------------------------------- | -------------- |
| `vite` | A client-only SPA behind login (consoles, dashboards); no SEO, no server | `vite`          | dev, build, preview, typecheck, lint, format, format:check, test, clean                       | `apps/console` |
| `next` | Server rendering, SEO or public pages; App Router, typed routes          | `next`          | dev, build, start, typecheck (`next typegen && tsc`), lint, format, format:check, test, clean | —              |
| `expo` | An iOS/Android app (native tabs, Liquid Glass, HeroUI Native)            | `expo`          | dev, ios, android, typecheck, lint, format, format:check, doctor, clean                       | `apps/mobile`  |
| `docs` | A Mintlify documentation site                                            | none            | dev, build, lint, format, a11y, clean (all `cd src && mint …`)                                | `apps/docs`    |

## Ports

`{{PORT}}` is the dev (and preview/start) port, passed with `--strictPort` for Vite so a clash fails loudly.

| Range     | For                    | Taken                      |
| --------- | ---------------------- | -------------------------- |
| 3700–3799 | `vite` and `next` apps | 3700 `console`             |
| 3333–3399 | `docs` sites           | 3333 `docs`                |
| —         | `expo`                 | Metro picks 8081; no token |

Pick the next free port in the range; `apps/*/package.json` `dev` scripts are the registry.

## Notes per kind

- `expo`: `app.json` uses `com.figentra.stackra.{{NAME}}` as the iOS bundle id and Android package. Android
  package segments cannot contain `-`, so a kebab name with a hyphen needs that segment edited by hand.
- `next`: `.gitignore` ignores `.next/` and `next-env.d.ts`; `turbo.json` adds `.next/**` as build outputs.
- `docs`: no TypeScript and no tests — `mint validate` and `mint broken-links` are its checks.
