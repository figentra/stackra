# @stackra/oxlint-config

oxlint presets. A workspace's `.oxlintrc.json` is
`{ "extends": ["../../../node_modules/@stackra/oxlint-config/<preset>.jsonc"] }` — oxlint resolves `extends`
as a file path, not a package export, so every preset stays a plain file at this package's root.

| Preset             | Extends | Adds                                                                                      |
| ------------------ | ------- | ----------------------------------------------------------------------------------------- |
| `base.jsonc`       | —       | categories: `correctness` error, `suspicious` warn; `any`, unused code, cycles are errors |
| `node.jsonc`       | base    | node env                                                                                  |
| `boundaries.jsonc` | node    | the tier dependency rule; the repo root extends this one                                  |
| `decorators.jsonc` | node    | DI tier: `consistent-type-imports` off, `new-cap` relaxed for decorator factories         |
| `react.jsonc`      | base    | react + jsx-a11y plugins, hooks rules                                                     |
