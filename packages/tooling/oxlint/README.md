# @stackra/oxlint-config

oxlint presets. A workspace's `.oxlintrc.jsonc` is
`{ "extends": ["../../../node_modules/@stackra/oxlint-config/src/<preset>.jsonc"] }` — oxlint resolves `extends`
as a file path, not a package export, so every preset stays a plain file in this package's `src/`.

| Preset             | Extends | Adds                                                                                      |
| ------------------ | ------- | ----------------------------------------------------------------------------------------- |
| `base.jsonc`       | —       | categories: `correctness` error, `suspicious` warn; `any`, unused code, cycles are errors |
| `node.jsonc`       | base    | node env                                                                                  |
| `boundaries.jsonc` | node    | the tier dependency rule; the repo root extends this one                                  |
| `decorators.jsonc` | node    | DI tier: `consistent-type-imports` off, `new-cap` relaxed for decorator factories         |
| `react.jsonc`      | base    | react + jsx-a11y plugins, hooks rules                                                     |
