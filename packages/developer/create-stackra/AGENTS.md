# AGENTS — create-stackra

<!--
Stackra file contract:
Purpose: the agent rules of create-stackra: where code goes and the rules that keep `npm create stackra` working from
         npmjs on a clean machine.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0199 (amendment of 2026-11-27); ADR 0453 (decisions 4 and 10); ADR 0083.
-->

The `npm create stackra` initializer (ADR 0199, amendment of 2026-11-27). Member at
`packages/developer/create-stackra` (`tier:lib`), the one unscoped member: `npm create <x>` runs the npmjs package
`create-<x>`, so its name cannot carry a scope (`UNSCOPED_PACKAGES` in `@stackra/repo-checks`). No code entry: the
package ships `bin.create-stackra` (`src/node/create-stackra.ts`) only.

## Where code goes

| You are writing…                          | It goes in…                                 |
| ----------------------------------------- | ------------------------------------------- |
| A step of the run, or parsing             | `src/node/functions/<name>.function.ts`     |
| Anything that touches the machine         | `PROCESS_HOST` (`src/node/constants/`) only |
| A constant                                | `src/node/constants/<name>.constant.ts`     |
| A type or an error                        | `src/node/{types,errors}/`                  |
| A test                                    | `__tests__/<name>.<kind>.test.ts` beside it |

## Rules

- **No runtime dependency, ever.** It installs from npmjs, where no `@stackra/*` package is; a dependency would also
  slow every `npm create`. Only Node's own modules; `tsdown` bundles the rest into `dist/create-stackra.mjs`.
- **Map the scope, never the registry.** The Stackra registry never proxies npmjs (ADR 0453 decision 4), so only
  `@stackra` is mapped, as the npx flag `--@stackra:registry=<origin>` for one run. Never write an `.npmrc`, never run
  `npm config set`, never set `npm_config_registry`.
- **It only hands over.** Every question, check and file of a new app belongs to `stackra create` in `@stackra/cli`;
  add a flag here only when it changes how the CLI is reached (registry, version).
- The registry order is `--registry`, `STACKRA_REGISTRY`, then `STACKRA_REGISTRY_DEFAULT`, which stays equal to
  `@stackra/cli`'s `REGISTRY_ORIGIN_DEFAULT`; change both together.
- Start children without a shell (`PROCESS_HOST.run`); on Windows npx is run as npm's `npx-cli.js` under this Node,
  never as `npx.cmd`.
- `"private": true` until the owner claims the npm name and rules on its npmjs publish (STA-2897): the release
  workflow publishes every non-private member to the Stackra registry, which accepts scoped names only.

## Tasks

`pnpm turbo run <task> --filter=create-stackra` — `build`, `typecheck`, `lint`, `test`, `test:coverage`, `format`,
`format:check`, `clean`.

## PII

| Data | Where | Handling                                                                  |
| ---- | ----- | ------------------------------------------------------------------------- |
| None | —     | It reads the environment only to pass it to npx; it stores and logs none. |
