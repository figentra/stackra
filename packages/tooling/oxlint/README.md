# @stackra/oxlint-config

oxlint presets. A workspace's `.oxlintrc.jsonc` is
`{ "extends": ["../../../node_modules/@stackra/oxlint-config/src/<preset>.jsonc"] }` — oxlint resolves `extends`
as a file path, not a package export, so every preset stays a plain file in this package's `src/`.

| Preset             | Extends | Adds                                                                                                                                                                                                                                                                         |
| ------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base.jsonc`       | —       | categories: `correctness` error, `suspicious` warn; `any`, unused code, cycles are errors; every `stackra/*` rule and `feature-flags/no-plan-targeting` (JS plugins loaded from source); kebab-case file names; the retired `@Injectable`/`@Inject`/`define*` imports banned |
| `node.jsonc`       | base    | node env                                                                                                                                                                                                                                                                     |
| `boundaries.jsonc` | node    | the tier dependency rule, cross-service bans and the package entry direction (contracts, core, node/react/native, testing); the repo root extends this one                                                                                                                   |
| `decorators.jsonc` | node    | DI tier: `consistent-type-imports` off, `new-cap` relaxed for decorator factories                                                                                                                                                                                            |
| `react.jsonc`      | base    | react + jsx-a11y plugins, hooks rules                                                                                                                                                                                                                                        |

## JS plugins

`base.jsonc` loads house rules shipped as oxlint JS plugins from their source file, by a path relative to the preset
(`../../../state/feature-flags/src/lint/constants/feature-flags-lint-plugin.constant.ts`). Node strips the types, so a
lint run needs no built dist and the root `lint` task keeps no `^build` dependency (ADR 0421). A plugin loaded this way
imports values only by relative `.ts` paths; a `#...` subpath import would not resolve outside a bundler.

| Plugin                     | Source file                                                                             | Rules                                |
| -------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------ |
| `@stackra/coding-standard` | `../../../developer/coding-standard/src/core/constants/stackra-plugin.constant.ts`      | all 17 `stackra/*` rules, at `error` |
| `@stackra/feature-flags`   | `../../../state/feature-flags/src/lint/constants/feature-flags-lint-plugin.constant.ts` | `feature-flags/no-plan-targeting`    |

`presets.test.ts` checks that `base.jsonc` turns on every rule `STACKRA_PLUGIN` registers. A new rule in
`@stackra/coding-standard` is added to `base.jsonc` in the same change.

`@stackra/coding-standard` is a peer dependency, so a repository outside this one installs it. The relative source
paths resolve only inside this repository: another repository's preset names the package (`"jsPlugins":
["@stackra/coding-standard"]`) and loads its built dist (ADR 0421 decision 3).
