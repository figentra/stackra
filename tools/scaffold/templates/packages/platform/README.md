# @stackra/{{NAME}}

{{DESCRIPTION}}

**Kind:** platform — a technical capability with a runtime-neutral core. **Tier:** `tier:lib`
(`packages/{{CATEGORY}}/{{NAME}}`).

## Entry points

| Import                   | Runtime                           |
| ------------------------ | --------------------------------- |
| `@stackra/{{NAME}}`      | runtime-neutral (re-exports core) |
| `@stackra/{{NAME}}/core` | runtime-neutral                   |

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
├── index.ts                          "." — re-exports core
└── core/                             runtime-neutral: no host library, no I/O
    ├── create-{{NAME}}-registry.ts   example factory — replace with the real capability
    └── __tests__/
```

A platform package never has a `presentation/` folder: it serves other packages and owns no business domain
to present.

## Opt-in entries

Add one only when a real consumer needs it. Each is a folder `src/<entry>/` (`index.ts` + `__tests__/`) plus:

| Entry         | Holds                                      | `exports` subpath | `imports` aliases            | Optional peer                     |
| ------------- | ------------------------------------------ | ----------------- | ---------------------------- | --------------------------------- |
| `./contracts` | types and constants only — no runtime code | `./contracts`     | `#contracts`, `#contracts/*` | none                              |
| `./testing`   | fakes and builders for consumers' tests    | `./testing`       | `#testing`, `#testing/*`     | none                              |
| `./react`     | React bindings (providers, hooks)          | `./react`         | `#react`, `#react/*`         | `react` (`catalog:frontend`)      |
| `./native`    | React Native bindings; composes `./react`  | `./native`        | `#native`, `#native/*`       | `react-native` (`catalog:mobile`) |
| `./node`      | Node-only adapters (fs, process, streams)  | `./node`          | `#node`, `#node/*`           | none (`@types/node` is a dev dep) |

For each: add the `exports` entry (`{ "types": "./src/<entry>/index.ts", "default": "./src/<entry>/index.ts" }`),
the two `imports` aliases, and an entry in `tsdown.config.ts`. A host entry's peer goes in `peerDependencies`
with `peerDependenciesMeta: { "<peer>": { "optional": true } }`, and in `devDependencies` for the tests; its
`*.test.tsx` files run under `@stackra/vitest-config/preset-react`. `core` never imports an entry.
