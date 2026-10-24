# Plan: `@stackra/i18n` wave 2

**Spec**: `.agents/specs/sta-348-i18n/spec.md`

## Design

- `src/core/enums/`: `Locale` (BCP 47 codes, endonym case data), `NumberingSystem` (`latn`, `arab`, `user`: the Intl
  `nu` spellings), `LocaleUrlStrategy`.
- `src/core/schemas/i18n-options.schema.ts`: `I18nOptions`, the options shape with launch defaults.
- `src/core/constants/i18n-config-schema.constant.ts`: `I18nConfig$`, hand-written until gen compiles package
  schemas (shortcut, STA-339), with field rules only: gen's member override is `I18nConfig$.extend({...})` over the
  same keys, which zod refuses on an object with refinements.
- `src/core/functions/check-i18n-options.function.ts` (internal): the cross-field rules as a `superRefine` callback.
- `src/config/i18n.config.ts`: `I18nConfig extends Config({ schema: I18nOptions })`; registers
  `[I18nOptions, I18nConfig$.superRefine(checkI18nOptions)]` (registry gap G1 shortcut).
- `src/core/functions/keys.function.ts`: recursive builder, `<namespace>::<path>`, `_` lifts leaves, frozen;
  `KeysOf<T>` types it from a `const` type parameter.
- `src/core/functions/merge-catalogues.function.ts`: deep merge, later wins, leaves replace whole.
- `src/core/functions/format-message.function.ts`: nested lookup, `intl-messageformat` with `ignoreTag`, compiled
  messages cached by locale and text; a missing message throws.
- `src/core/functions/intl-locale.function.ts` (internal): the `-u-nu-` tag.
- `src/react/i18n-provider/`: context, provider (reads `useConfig(I18nConfig)`), `useI18nState` (internal).
- `src/react/{translation,locale,formatting}/`: the six hooks; `useLocaleChoice` on `useSyncExternalStore` with a
  `null` server snapshot over the configured cookie.

## Constitution check

- Boundaries: runtime imports `@stackra/contracts`, `@stackra/config`, `@stackra/money`, `@stackra/validation`,
  `intl-messageformat`, `zod` and React (optional peer); `@stackra/container` only in tests.
- Versions: catalogs and `workspace:*` only; `intl-messageformat` needs its catalog pin from the owner.
- Naming: enum codes snake_case except the tool-owned BCP 47 and Intl `nu` spellings; `I18nConfig$` is gen's `X$`
  name.

## Properties

- **P-001**: For any catalogues `a`, `b`, every leaf path of `b` resolves in `mergeCatalogues([a, b])` to `b`'s value.
- **P-002**: For any key tree, every leaf of `keys(tree)` equals `<namespace>::<path to it>`.
