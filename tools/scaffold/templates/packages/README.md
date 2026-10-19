# Package templates

Templates the scaffold script copies into a new workspace member. Pick a kind, replace the tokens, copy the
root `LICENSE` byte-for-byte (it is not in the templates).

| Kind       | Pick it when                                                                                | Lands in                         | Name                       | Tier          | `exports`                                                                | Scripts                                                                  |
| ---------- | ------------------------------------------------------------------------------------------- | -------------------------------- | -------------------------- | ------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `domain`   | a business capability: entities, use cases, adapters, a delivery surface                    | `packages/{{CATEGORY}}/{{NAME}}` | `@stackra/{{NAME}}`        | `tier:lib`    | `.`, `./core`, `./application`, `./infrastructure`, `./presentation/api` | build, typecheck, lint, test, test:coverage, format, format:check, clean |
| `platform` | a technical capability other packages build on, runtime-neutral core, optional host entries | `packages/{{CATEGORY}}/{{NAME}}` | `@stackra/{{NAME}}`        | `tier:lib`    | `.`, `./core`                                                            | same as domain                                                           |
| `lib`      | a small flat utility with one entry and no layers                                           | `packages/{{CATEGORY}}/{{NAME}}` | `@stackra/{{NAME}}`        | `tier:lib`    | `.`                                                                      | same as domain                                                           |
| `tooling`  | a shared config preset (JSON/JSONC) consumed by other members' config files                 | `packages/tooling/{{NAME}}`      | `@stackra/{{NAME}}-config` | `tier:config` | `.`, `./base`                                                            | format, format:check, lint, test                                         |

Domain vs platform: would the code need renaming to make sense in a different product? Domain. Does it serve
other packages with no business meaning of its own? Platform. Lib is platform without the subpaths.

Every lib kind's `exports` point at source (`./src/**/index.ts`); `tsdown` builds `dist/` only for publishing.
Tests sit beside the code in `src/**/__tests__/`, and each template ships passing tests (the vitest preset
fails an empty suite).

## Tokens

Plain-text replacement in file contents **and** path names.

| Token             | Value                                                                                                                                                                                        | Example                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `{{NAME}}`        | kebab-case package short name                                                                                                                                                                | `container`             |
| `{{PASCAL}}`      | PascalCase of `{{NAME}}`                                                                                                                                                                     | `Container`             |
| `{{CATEGORY}}`    | the `packages/` folder: foundation, application, communication, cross-cutting, data, developer, experience, runtime, security, state (tooling kind: unused — it lives in `packages/tooling`) | `foundation`            |
| `{{DESCRIPTION}}` | one sentence; becomes `description` in package.json and opens README/AGENTS                                                                                                                  | `Dependency injection.` |
