# tools/scaffold

`templates/` holds one folder per kind (`packages/{domain,platform,lib,tooling}`, `apps/{vite,expo,docs,next}`,
`services/encore`); each folder's parent `README.md` documents the kinds. `tools/scripts/scaffold.mjs` (`pnpm new`)
copies a kind into its destination and replaces exactly six tokens in file contents and path names: `{{NAME}}`,
`{{PASCAL}}`, `{{TITLE}}`, `{{DESCRIPTION}}`, `{{PORT}}`, `{{CATEGORY}}`. Other `{{ … }}` text (JSX) is left alone.

- `DESCRIPTION` and `TITLE` are JSON-escaped when written into `.json`/`.jsonc` files.
- The root `LICENSE` is copied byte-for-byte into every new workspace member (not into service units).
- The result is formatted with `oxfmt` after replacement.
- To change a kind, edit its template, then `pnpm test`/`node --test tools/scripts/scaffold.test.mjs`.

Usage and the kinds table: `apps/docs/src/guides/standards.mdx`.
