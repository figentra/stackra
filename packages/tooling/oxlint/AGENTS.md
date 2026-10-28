# AGENTS — @stackra/oxlint-config

- Owner: release-operations (the owner owns `boundaries.jsonc`).
- Do not add rules in a consuming workspace; change the preset and ship a changeset.
- A new boundary pattern is an architecture change: it needs an ADR and a constitution update.
- `base.jsonc` turns on every `stackra/*` rule at `error`; keep the list equal to `STACKRA_PLUGIN.rules`
  (`presets.test.ts` checks it). JS plugins load from their source file (ADR 0421).
- `no-restricted-imports` does not merge across overrides: every override in `boundaries.jsonc` repeats the
  deep-src and retired-import patterns, and each new pattern needs a banned line in `src/__tests__/fixtures/`.
- The rule-gap cheap set (N-1 to N-10, stackra-229) is in `base.jsonc` at error; a new site is fixed or carries a
  reasoned `oxlint-disable-next-line <rule> -- <reason>`, never a lower severity. The `.tsx` override carries the
  react and jsx-a11y rules, because no member extends `react.jsonc`.
- No rule is at `warn` (rule-gap B-1, stackra-230): `suspicious` is an error and a member lints without
  `--deny-warnings`, so a warning would never fail. B-2 (`no-array-sort`) and B-5 (promise executor, code point,
  structured clone, spread) are at error too. Until the base lib is ES2023, a sort or reverse of a just-built array
  carries a reasoned disable; never run `--fix` for `prefer-spread` on typed arrays (it yields a `number[]`).
- B-3 (stackra-231): numeric separators, switch-case braces, `replaceAll` and `catch-error-name` at error;
  `number-literal-case` off (oxfmt lowercases hex digits). Never `--fix` `catch-error-name`: its rename to `error`
  can shadow an outer `error`; use an `Error`-suffixed name (`caughtError`) there.
- B-4 (stackra-232): `typescript/method-signature-style` is `property` at error. Interface and type-literal members,
  augmentations included, are `name: (args) => R`, so a driver's parameters are checked strictly against its port.
- B-6 and B-8 (stackra-233): `eqeqeq` smart everywhere; on `.tsx`, `no-param-reassign` with props (a localized
  default is `const label = labelProp ?? t(...)`), `react/display-name`, `react/only-export-components` and
  `react/jsx-no-literals` (ignoreProps, punctuation allowed) at error; the last two React rules are off in tests,
  stories and e2e. A test override that turns a React rule off must name `"plugins": ["react"]`, or oxlint ignores it.
  An `Object.assign(Root, parts)` compound carries a reasoned file-level disable of only-export-components (React
  Refresh takes the root function as the component). `jsx-a11y/prefer-tag-over-role` is decided off.
- B-7 (stackra-234): `typescript/explicit-module-boundary-types` at error in packages (off in apps, workers, tools,
  build scripts, tests, stories, e2e). Spell the return type of every exported function and public class member:
  `ReactElement` for a component, the base's node type for a panel override, an object type of resources for a
  Pulumi helper. Never infer the public type of a package.
- Secrets: forbidden.

## PII

| Data | Where | Handling                                                                     |
| ---- | ----- | ---------------------------------------------------------------------------- |
| none | —     | Lint presets (JSON); they read source files at lint time and retain nothing. |
