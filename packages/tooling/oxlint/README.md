# @stackra/oxlint-config

oxlint presets. A workspace's `.oxlintrc.jsonc` is
`{ "extends": ["../../../node_modules/@stackra/oxlint-config/src/<preset>.jsonc"] }` — oxlint resolves `extends`
as a file path, not a package export, so every preset stays a plain file in this package's `src/`.

| Preset             | Extends | Adds                                                                                                                                                        |
| ------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base.jsonc`       | —       | categories: `correctness` error, `suspicious` warn; `any`, unused code, cycles are errors; `feature-flags/no-plan-targeting` (JS plugin loaded from source) |
| `node.jsonc`       | base    | node env                                                                                                                                                    |
| `boundaries.jsonc` | node    | the tier dependency rule; the repo root extends this one                                                                                                    |
| `decorators.jsonc` | node    | DI tier: `consistent-type-imports` off, `new-cap` relaxed for decorator factories                                                                           |
| `react.jsonc`      | base    | react + jsx-a11y plugins, hooks rules                                                                                                                       |

## JS plugins

`base.jsonc` loads house rules shipped as oxlint JS plugins from their source file, by a path relative to the preset
(`../../../state/feature-flags/src/lint/constants/feature-flags-lint-plugin.constant.ts`). Node strips the types, so a
lint run needs no built dist and the root `lint` task keeps no `^build` dependency (ADR 0421). A plugin loaded this way
imports values only by relative `.ts` paths; a `#...` subpath import would not resolve outside a bundler.
