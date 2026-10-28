# @stackra/oxlint-config

oxlint presets. A workspace's `.oxlintrc.jsonc` is
`{ "extends": ["../../../node_modules/@stackra/oxlint-config/src/<preset>.jsonc"] }` — oxlint resolves `extends`
as a file path, not a package export, so every preset stays a plain file in this package's `src/`.

| Preset             | Extends | Adds                                                                                                                                                                                                                                                                                                         |
| ------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `base.jsonc`       | —       | categories: `correctness` error, `suspicious` warn; `any`, unused code, cycles are errors; every `stackra/*` rule and `feature-flags/no-plan-targeting` (JS plugins loaded from source); kebab-case file names; the retired `@Injectable`/`@Inject`/`define*` imports banned; the rule-gap cheap set (below) |
| `node.jsonc`       | base    | node env                                                                                                                                                                                                                                                                                                     |
| `boundaries.jsonc` | node    | the tier dependency rule, cross-service bans and the package entry direction (contracts, core, node/react/native, testing); the repo root extends this one                                                                                                                                                   |
| `decorators.jsonc` | node    | DI tier: `consistent-type-imports` off, `new-cap` relaxed for decorator factories                                                                                                                                                                                                                            |
| `react.jsonc`      | base    | react + jsx-a11y plugins, hooks rules                                                                                                                                                                                                                                                                        |

## The rule-gap cheap set (stackra-229, owner D11)

All at `error` in `base.jsonc` (rule-gap list N-1 to N-10, notes `handover/testing/rule-gap-list.md`):

| Row  | Rules                                                                                                                                                                                                                                                                                                                                                                                    | Where                                                                                       |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| N-1  | `stackra/one-declaration-per-file` off for single-file CLIs                                                                                                                                                                                                                                                                                                                              | `tools/scripts/*.mjs`, `.agents/hooks/*.mjs`, `.opencode/plugins/**`; root `pnpm lint:root` |
| N-2  | `react` and `jsx-a11y` plugins (their correctness rules), `react/rules-of-hooks`, `react/jsx-no-target-blank` at error, `react/exhaustive-deps` warn; `jsx-a11y/prefer-tag-over-role` off until stackra-233                                                                                                                                                                              | every `**/*.tsx`                                                                            |
| N-4  | `typescript/ban-ts-comment` (`ts-ignore` and `ts-nocheck` banned, `ts-expect-error` banned outside tests and allowed with a description in tests), `typescript/prefer-ts-expect-error`                                                                                                                                                                                                   | everywhere                                                                                  |
| N-7  | `array-callback-return`, `no-self-compare`, `no-fallthrough`, `no-unreachable-loop`, `no-useless-assignment`, `no-loop-func`, `no-constructor-return`, `no-sequences`, `no-empty`, `no-useless-return`, `oxc/no-accumulating-spread`, `typescript/no-dynamic-delete`, `no-invalid-void-type`, `no-empty-object-type`, `no-empty-interface`, `unified-signatures`, `prefer-for-of`        | everywhere                                                                                  |
| N-8  | `prefer-const`, `import/no-duplicates`, `typescript/no-import-type-side-effects`, `typescript/no-inferrable-types` (properties ignored), `unicorn/prefer-set-has`, `prefer-array-find`, `text-encoding-identifier-case` (off in data-transfer and fiscal, whose contracts carry `utf-8`), `prefer-at`, `consistent-date-clone`, `prefer-type-error`, `no-useless-promise-resolve-reject` | everywhere                                                                                  |
| N-9  | `react/button-has-type`, `no-array-index-key`, `no-object-type-as-default-prop`, `jsx-no-useless-fragment` (expressions allowed)                                                                                                                                                                                                                                                         | every `**/*.tsx`                                                                            |
| N-10 | `no-console`                                                                                                                                                                                                                                                                                                                                                                             | off for tools, agent hooks, editor plugins, package `scripts/`, apps and workers            |

`decorators.jsonc` needs no new wiring: `boundaries.jsonc` already applies its `new-cap` and `no-extraneous-class`
settings to every package and app file, and keeps `consistent-type-imports` on (ADR 0005 d5). N-5 (the
`no-explicit-any` disable ratchet) and N-6 (the duplicate-export `PENDING` list, shrink-only) live in
`tools/scripts/` and run in `pnpm validate`.

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
