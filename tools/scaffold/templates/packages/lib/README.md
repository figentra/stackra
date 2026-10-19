# @stackra/{{NAME}}

{{DESCRIPTION}}

**Kind:** lib — a small flat utility with one entry. **Tier:** `tier:lib` (`packages/{{CATEGORY}}/{{NAME}}`).

## Entry points

| Import              | Holds                 |
| ------------------- | --------------------- |
| `@stackra/{{NAME}}` | everything it exports |

`exports` point at source; `tsdown` builds `dist/` only for publishing.

## Tasks

| Task            | Command                                         |
| --------------- | ----------------------------------------------- |
| `build`         | `tsdown`                                        |
| `typecheck`     | `tsc --noEmit`                                  |
| `lint`          | `oxlint .`                                      |
| `test`          | `vitest run`                                    |
| `test:coverage` | `vitest run --coverage` (shared gate: 80/80/70) |
| `format`        | `oxfmt --write .`                               |
| `format:check`  | `oxfmt --check .`                               |
| `clean`         | `rm -rf dist coverage .turbo`                   |

Run one with `pnpm turbo run <task> --filter=@stackra/{{NAME}}`.

## Structure

```text
src/
├── index.ts                    "." — re-exports only
├── format-{{NAME}}-label.ts    example — replace with the real code
└── __tests__/index.test.ts     tests through the public entry
```

Logic lives in sibling files, not in `index.ts`: the shared coverage gate ignores `src/**/index.ts`.
Outgrowing one entry (a second subpath, layers, a host binding) means it is a platform or domain package.
