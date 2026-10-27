# tools/scaffold

`templates/` holds one folder per kind; `tools/scripts/scaffold.mjs` (`pnpm new`) renders them. Kinds are decided in
ADR 0126, and every member comes out in the programming model v3 shape (ADR 0294 rule R12, ADR 0295): `stackra.config.ts`,
one root module, no authored `main.ts` or entry barrel; the docs app has `stackra.config.ts` but no module (its
site is `src/config/docs.config.ts`, ADR 0002 amendment of 2026-10-27), and the tooling presets are exempt. Usage is in
`apps/docs/src/guides/scaffolding.mdx`; the group tables are `tools/scripts/structure.mjs`.

| Kind          | Template                             | Lands in                     |
| ------------- | ------------------------------------ | ---------------------------- |
| `service`     | `services/service`                   | `services/<name>`            |
| `package`     | `packages/package` + entries, `data` | `packages/<category>/<name>` |
| `tooling`     | `packages/tooling`                   | `packages/tooling/<name>`    |
| `app:console` | `apps/console`                       | `apps/<name>`                |
| `app:mobile`  | `apps/mobile`                        | `apps/<name>`                |
| `app:desktop` | `apps/desktop`                       | `apps/<name>`                |
| `app:docs`    | `apps/docs`                          | `apps/<name>`                |

`packages/entries/<entry>/` holds the folder of one optional package entry (`react`, `native`, with `--entries`), and
`packages/data/` the module's `src/node/database/` folders (with `--data`). The generator writes the package's
`exports`, one per entry that has a file, each naming that file until gen writes the entry barrels (STA-339), and its
`imports` aliases.

Tokens, replaced in file contents and path names: `{{NAME}}`, `{{PASCAL}}`, `{{TITLE}}`, `{{DESCRIPTION}}`,
`{{PORT}}`, `{{CATEGORY}}`, and `{{ENTRIES}}` (the package's tsdown entry map, one public file per export). Other `{{ … }}` text (JSX) is
left alone. `DESCRIPTION` and `TITLE` are JSON-escaped in `.json`/`.jsonc` files. The target repo's `LICENSE` is
copied into new packages and tooling only (apps and services are UNLICENSED, ADR 0195), and the result is formatted with oxfmt.

Template files hold tokens, so they are not valid TypeScript: oxfmt and oxlint skip `tools/scaffold/templates/**`.
To change a kind, edit its template, then run `node --test tools/scripts/__tests__/scaffold.test.mjs`.
