# @stackra/oxlint-config

oxlint presets. A workspace's `.oxlintrc.jsonc` is
`{ "extends": ["../../../node_modules/@stackra/oxlint-config/src/<preset>.jsonc"] }` — oxlint resolves `extends`
as a file path, not a package export, so every preset stays a plain file in this package's `src/`.

| Preset             | Extends | Adds                                                                                                                                                                                                                                                                                                       |
| ------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base.jsonc`       | —       | categories: `correctness` and `suspicious` error; `any`, unused code, cycles are errors; every `stackra/*` rule and `feature-flags/no-plan-targeting` (JS plugins loaded from source); kebab-case file names; the retired `@Injectable`/`@Inject`/`define*` imports banned; the rule-gap cheap set (below) |
| `node.jsonc`       | base    | node env                                                                                                                                                                                                                                                                                                   |
| `boundaries.jsonc` | node    | the tier dependency rule, cross-service bans and the package entry direction (contracts, core, node/react/native, testing); the repo root extends this one                                                                                                                                                 |
| `decorators.jsonc` | node    | DI tier: `consistent-type-imports` off, `new-cap` relaxed for decorator factories                                                                                                                                                                                                                          |
| `react.jsonc`      | base    | react + jsx-a11y plugins, hooks rules                                                                                                                                                                                                                                                                      |

## The rule-gap cheap set (stackra-229, owner D11)

All at `error` in `base.jsonc` (rule-gap list N-1 to N-10, notes `handover/testing/rule-gap-list.md`):

| Row  | Rules                                                                                                                                                                                                                                                                                                                                                                                    | Where                                                                                       |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| N-1  | `stackra/one-declaration-per-file` off for single-file CLIs                                                                                                                                                                                                                                                                                                                              | `tools/scripts/*.mjs`, `.agents/hooks/*.mjs`, `.opencode/plugins/**`; root `pnpm lint:root` |
| N-2  | `react` and `jsx-a11y` plugins (their correctness rules), `react/rules-of-hooks`, `react/jsx-no-target-blank` at error, `react/exhaustive-deps` error (B-1); `jsx-a11y/prefer-tag-over-role` off until stackra-233                                                                                                                                                                       | every `**/*.tsx`                                                                            |
| N-4  | `typescript/ban-ts-comment` (`ts-ignore` and `ts-nocheck` banned, `ts-expect-error` banned outside tests and allowed with a description in tests), `typescript/prefer-ts-expect-error`                                                                                                                                                                                                   | everywhere                                                                                  |
| N-7  | `array-callback-return`, `no-self-compare`, `no-fallthrough`, `no-unreachable-loop`, `no-useless-assignment`, `no-loop-func`, `no-constructor-return`, `no-sequences`, `no-empty`, `no-useless-return`, `oxc/no-accumulating-spread`, `typescript/no-dynamic-delete`, `no-invalid-void-type`, `no-empty-object-type`, `no-empty-interface`, `unified-signatures`, `prefer-for-of`        | everywhere                                                                                  |
| N-8  | `prefer-const`, `import/no-duplicates`, `typescript/no-import-type-side-effects`, `typescript/no-inferrable-types` (properties ignored), `unicorn/prefer-set-has`, `prefer-array-find`, `text-encoding-identifier-case` (off in data-transfer and fiscal, whose contracts carry `utf-8`), `prefer-at`, `consistent-date-clone`, `prefer-type-error`, `no-useless-promise-resolve-reject` | everywhere                                                                                  |
| N-9  | `react/button-has-type`, `no-array-index-key`, `no-object-type-as-default-prop`, `jsx-no-useless-fragment` (expressions allowed)                                                                                                                                                                                                                                                         | every `**/*.tsx`                                                                            |
| N-10 | `no-console`                                                                                                                                                                                                                                                                                                                                                                             | off for tools, agent hooks, editor plugins, package `scripts/`, apps and workers            |

## The B group: B-1 to B-6 and B-8 (stackra-230 to stackra-233, owner D11)

| Row | Change                                                                                                                                      | Where                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| B-1 | `suspicious` category and `react/exhaustive-deps` at `error`: no warn level is left, because a member's `oxlint .` never fails on a warning | everywhere; `no-array-reverse` off in tests |
| B-2 | `unicorn/no-array-sort` (`allowExpressionStatement`: a bare `x.sort();` passes)                                                             | everywhere but tests                        |
| B-5 | `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone`, `unicorn/prefer-spread`                       | everywhere                                  |
| B-3 | `unicorn/numeric-separators-style`, `switch-case-braces`, `prefer-string-replace-all`, `catch-error-name`; `number-literal-case` stays off  | everywhere                                  |
| B-4 | `typescript/method-signature-style` set to `property`: a method signature is checked bivariantly                                            | everywhere                                  |
| B-6 | `eqeqeq` (`smart`); `no-param-reassign` (props), `react/display-name`, `react/only-export-components`                                       | eqeqeq everywhere, the rest on `.tsx`       |
| B-8 | `react/jsx-no-literals` (`ignoreProps`, punctuation in `allowedStrings`)                                                                    | `.tsx` but tests, stories and e2e           |

`toSorted` and `toReversed` are ES2023 and the TypeScript base lib is ES2022, so a TypeScript site that sorts or
reverses an array it just built carries `oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here,
...`; the Node-only `.mjs` tools use `toSorted`. When the lib moves to ES2023, those disables become `toSorted()`. The
same holds for byte-level `charCodeAt` (a binary string), text hashes and deliberate JSON round trips (the wire shape):
they keep their form with a reason. `prefer-spread`'s autofix turns a typed-array `.slice()` into a `number[]`; copy a
typed array with `new Uint8Array(x)` instead.

B-3 (stackra-231) is the autofix sweep. `number-literal-case` stays off: it wants uppercase hex digits and oxfmt prints
them lowercase, so the two would fight. `catch-error-name` wants `error`; where an outer `error` is in scope, name the
parameter with an `Error` suffix (`caughtError`, `readError`), which the rule accepts and which does not shadow. Never
run its `--fix`: it renames to `error` even when that shadows an outer `error`, which silently rebinds the outer name.

B-4 (stackra-232) closes the bivariance hole on ports: a method signature (`find(id: string): Promise<T>`) is checked
bivariantly even under `strictFunctionTypes`, so a driver could take a narrower argument than its port promises. Write
members as properties (`find: (id: string) => Promise<T>`), in module augmentations too. oxlint has no autofix for it;
a class method still implements a property member, so only the type side changes.

B-6 and B-8 (stackra-233) are the React hygiene rows. A component never reassigns a prop: a localized default is a new
const (`const label = labelProp ?? t(UI_KEYS...)`). `no-param-reassign` stays off outside `.tsx`, where domain services
mutate the record they own and the CLI parsers move a cursor. User-facing JSX text is a lang key in the seven locales;
the apps keep theirs in the file's `STRINGS` constant until they adopt @stackra/i18n, and token names or glyph
specimens are expressions. A compound built as `Object.assign(Root, parts)` keeps a reasoned file-level disable of
`only-export-components`: its export is the root function, which React Refresh takes as a component. The `Field` table
(`Object.freeze`) is not, so its parts live in their own files. `jsx-a11y/prefer-tag-over-role` is decided off for all
110 sites: `role="status"` live regions (`<output>` is not announced reliably), React Native views and house components
(no tag), non-form groups (a fieldset adds form semantics) and the `<kbd role="img">` spoken-name pattern.

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
