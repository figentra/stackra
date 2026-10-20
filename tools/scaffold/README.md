# tools/scaffold

`templates/` holds one folder per kind; `tools/scripts/scaffold.mjs` (`pnpm new`) renders them. Member shapes are
decided in ADR 0126; usage is in `apps/docs/src/guides/scaffolding.mdx`.

| Kind          | Template                     | Lands in                     |
| ------------- | ---------------------------- | ---------------------------- |
| `service`     | `services/service`           | `services/<name>`            |
| `package`     | `packages/package` + entries | `packages/<category>/<name>` |
| `tooling`     | `packages/tooling`           | `packages/tooling/<name>`    |
| `app:console` | `apps/console`               | `apps/<name>`                |
| `app:mobile`  | `apps/mobile`                | `apps/<name>`                |
| `app:desktop` | `apps/desktop`               | `apps/<name>`                |
| `app:docs`    | `apps/docs`                  | `apps/<name>`                |

`packages/entries/<entry>/` holds the files of one optional package entry (`contracts`, `node`, `react`,
`native`, `testing`, `devtools`); the generator copies the chosen ones and writes their `exports` keys.

Tokens, replaced in file contents and path names: `{{NAME}}`, `{{PASCAL}}`, `{{TITLE}}`, `{{DESCRIPTION}}`,
`{{PORT}}`, `{{CATEGORY}}`, and `{{ENTRIES}}` (the package's tsdown entry map). Other `{{ … }}` text (JSX) is
left alone. `DESCRIPTION` and `TITLE` are JSON-escaped in `.json`/`.jsonc` files. The target repo's `LICENSE` is
copied into every new member and the result is formatted with oxfmt.

Template files hold tokens, so they are not valid TypeScript: oxfmt and oxlint skip `tools/scaffold/templates/**`.
To change a kind, edit its template, then run `node --test tools/scripts/__tests__/scaffold.test.mjs`.
