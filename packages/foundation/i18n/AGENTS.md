# AGENTS — @stackra/i18n

Locales, the i18n configuration, the ICU engine and the React hooks. Member at `packages/foundation/i18n`
(`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts` and `./react`.

## Where code goes

| You are writing…                        | It goes in…                                         |
| --------------------------------------- | --------------------------------------------------- |
| The configuration class                 | `src/config/i18n.config.ts`                         |
| Its options shape                       | `src/core/schemas/i18n-options.schema.ts`           |
| Its shipped zod schema (`I18nConfig$`)  | `src/core/constants/i18n-config-schema.constant.ts` |
| An enum                                 | `src/core/enums/<name>.enum.ts`                     |
| A function, a type                      | `src/core/{functions,types}/`                       |
| A provider port, or a type it exchanges | `src/contracts/{ports,types}/`                      |
| React code                              | `src/react/<name>/`                                 |
| A test                                  | `__tests__/<name>.<kind>.test.ts(x)` beside it      |

## Entries and barrels

- `src/{core,react}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add every new public
  file to its barrel and to that entry's `index.test.ts`.
- The `.` barrel re-exports `I18nConfig` from the `src/config/` entry folder.
- `I18nConfig$` mirrors `I18nOptions` by hand until gen compiles this package's schemas; change both together. It
  carries no object-level refinement (gen's overrides `.extend` it); cross-field rules go in `checkI18nOptions`.

## This package

- A `Locale` code is a BCP 47 tag in BCP 47 case; URL prefixes are its lowercase form (ADR 0297). A new locale is a new
  case with its endonym.
- Fallback is resolved by merging catalogues (`mergeCatalogues`, farthest first), never inside `formatMessage`. A key
  with no message throws; never return the raw key.
- Digits travel as the `-u-nu-` extension (`intlLocale`); do not pass `numberingSystem` options separately.
- `useLocaleChoice` never runs on the server path: its server snapshot is `null`, and nothing here reads the cookie to
  redirect or vary a response.
- No parameter properties and no `#private` fields: apps typecheck this source under `erasableSyntaxOnly`.
- No vendor SDK and no provider driver here (ADR 0147, 0236): translators, geocoders and autocomplete providers are
  Integrations behind the `./contracts` ports, chosen per tenant and Market (ADR 0356).
- Configuration, not code: an address layout, a Market's length unit or digit choice is data passed in. Address and
  country types are `@stackra/validation`'s; do not redeclare them.
- `normalizeArabic` is the only Arabic normaliser; callers keep no copy (ADR 0080 note).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII and secrets

| Data              | Where                    | Handling                                                                |
| ----------------- | ------------------------ | ----------------------------------------------------------------------- |
| Locale choice     | the `cookieName` cookie  | a locale code only; first-party, `SameSite=Lax`, never a redirect input |
| Message arguments | `t(key, values)` callers | formatted, never logged; an error names the key, never a value          |
