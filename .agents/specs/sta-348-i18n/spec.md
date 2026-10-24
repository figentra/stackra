# Feature Specification: `@stackra/i18n` wave 2, locales, the ICU engine and the React hooks

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/i18n` (foundation, wave 2) for real: the `Locale`, `NumberingSystem` and
`LocaleUrlStrategy` enums, `I18nConfig` with its shipped `I18nConfig$`, the ICU engine over namespaced catalogues with
regional overlays (`formatMessage`, `mergeCatalogues`), the typed key builder gen calls (`keys`), and the `./react`
provider and hooks.

## Impact

- **Apps touched**: none (the template's web, mobile and console apps consume it, STA-344)
- **Services touched**: none
- **Packages touched**: `packages/foundation/i18n` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none (the locale choice is a first-party cookie holding a locale code)
- **Secrets**: none
- **ADR needed**: no (ADR 0080 as amended by 0192, 0268 and 0305; ADR 0297 decision 4; ADR 0127 places i18n in
  foundation)
- **New dependencies**: `intl-messageformat` (ICU parsing, plural rules and argument formatting; the ported Figentra OS
  package used it), referenced as `catalog:`; the owner adds the catalog pin. Others come from existing catalogs:
  `zod`, React and, for tests, `@testing-library/react` and `jsdom`.
- **Deploy modes**: same in all; isomorphic, `./react` runs on web and native
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/foundation/i18n/README.md`, `packages/foundation/i18n/AGENTS.md`; ADR 0080, 0120, 0127, 0192, 0268, 0294, 0297, 0305 are cited and amended only by a note if a decision here changes
- **Lane**: full (a new package)
- **Change risk**: R2 (user-visible text and prices; a wrong plural or digit is visible, not a data defect)

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Registry row; the template is the consumer contract

## User Scenarios & Testing

### User Story 1 - A member configures its locales (Priority: P1)

The template's web, mobile and console apps each override `I18nConfig` in `src/config/i18n.config.ts` with
`locales`, `defaultLocale`, `rtl`, `fallbacks`, `numerals`, `urlStrategy`, `failOnMissingLocale`, `cookieName`,
`followDevice` and `tenantChoosesNumerals`, using `Locale`, `NumberingSystem` and `LocaleUrlStrategy`.

**Independent Test**: `src/config/__tests__/i18n.config.test.ts`.

**Acceptance Scenarios**:

1. **Given** the template's web override, **When** `buildConfig` builds it, **Then** it validates, freezes and keeps
   every override (`fallbacks["ar-SA"]` is `["ar", "en"]`), and the key is `i18n`.
2. **Given** a default locale or a fallback locale outside `locales`, **When** `buildConfig` runs, **Then** it throws
   `ConfigInvalidError`.

### User Story 2 - Gen's `#stackra/i18n` builds keys, loads and translates (Priority: P1)

The generated `#stackra/i18n` calls `keys({...})` for the typed `I18n` tree, types its loaders with `LoadCatalogue`
and `Locale`, merges the fallback chain with `mergeCatalogues`, and translates route meta on the server with
`formatMessage(messages, key, values, locale)`.

**Independent Test**: `src/core/functions/__tests__/{keys,merge-catalogues,format-message}.function.test.ts`.

**Acceptance Scenarios**:

1. **Given** `keys({ web: { features: { _: ["title"], catalogue: ["title"] } } })`, **Then** `I18n.web.features.title`
   is `"web::features.title"` and `I18n.web.features.catalogue.title` is `"web::features.catalogue.title"`, both typed
   `I18nKey`; a raw string is not an `I18nKey`.
2. **Given** `en`, `ar` and an `ar-SA` overlay merged farthest first, **Then** the overlay's keys win and every other
   key keeps its base-language string.
3. **Given** an Arabic plural with `zero one two few many other`, **Then** 0, 1, 2, 3, 11 and 100 each pick their
   category.
4. **Given** a key with no message after the merge, **Then** `formatMessage` throws; it never renders the raw key.

### User Story 3 - Components translate and format (Priority: P1)

Class components declare `translation = useTranslation()`, `money = useMoney()`, `number = useNumber()`,
`dateTime = useDateTime()`, `localeInfo = useLocale()` and `choice = useLocaleChoice()`, then call
`t(I18n.web.nav.home)`, `this.money(priceMinor, currency)`, `this.money(perMonth(...))`,
`this.dateTime(date, { dateStyle: "medium" })`, `this.number(balance)`, `endonym(code)`, `direction`,
`setLocale(code)`, `choice.chosen` and `choice.choose(code)`.

**Independent Test**: the tests beside each hook under `src/react/`.

**Acceptance Scenarios**:

1. **Given** the template's pricing ladder in `en`, **Then** `money(9_900, "SAR")` is `"SAR 99.00"` and the yearly
   per-month price `Money.ofMinor(100_000, "SAR").divide(12, Rounding.Down)` is `"SAR 83.33"`.
2. **Given** `numerals: NumberingSystem.Latn` and an Arabic locale, **Then** numbers render with Latin digits;
   **Given** `NumberingSystem.Arab`, **Then** with Arabic-Indic digits.
3. **Given** `rtl: [Ar, ArSa]`, **Then** `useLocale().direction` is `"rtl"` in `ar-SA` and `endonym("ar")` is
   `"العربية"`.
4. **Given** no choice, **Then** `useLocaleChoice().chosen` is `null` (and always on the server); **When**
   `choose("ar-SA")` runs in the browser, **Then** the configured cookie holds `ar-SA` and every reader re-renders.

### Edge Cases

- A cookie value that is not a shipped locale reads as no choice.
- `useLocale().setLocale` on the web (no setter given to the provider) rejects with a message to navigate instead.
- An unsafe minor amount or an unknown currency in `useMoney` throws `RangeError` (from `Money.ofMinor`).
- An invalid date in `useDateTime` throws instead of printing "Invalid Date".
- A `__proto__` key in a parsed catalogue never replaces the prototype.

## Requirements

- **FR-001**: The package SHALL be `@stackra/i18n` at `packages/foundation/i18n`, `tier:lib`, entries `.` and
  `./react` only (registry row; ADR 0127; ADR 0294 decision 15).
- **FR-002**: `.` SHALL export `I18nConfig`, `I18nConfig$`, `Locale`, `LocaleUrlStrategy`, `NumberingSystem`,
  `formatMessage`, `keys`, `mergeCatalogues` and the types `I18nKey` and `LoadCatalogue`, and no other value.
- **FR-003**: `./react` SHALL export `useDateTime`, `useLocale`, `useLocaleChoice`, `useMoney`, `useNumber`,
  `useTranslation`, and `I18nProvider` (with `I18nProviderProps`) for the generated `Contexts` to mount.
- **FR-004**: Every enum SHALL be `Enum.of` from `@stackra/contracts` with a same-named type; `Locale` codes are
  BCP 47 tags (`en`, `en-US`, `ar`, `ar-SA`) with an endonym as case data.
- **FR-005**: `I18nConfig` SHALL be `Config({ schema: I18nOptions })`, its schema registered as its shipped
  `I18nConfig$` plus the cross-field rules; the exported `I18nConfig$` SHALL carry no object-level refinement, so a
  member's generated `I18nConfig$.extend({...})` override loads.
- **FR-006**: Digits SHALL apply as the `-u-nu-` extension of the locale tag for every formatter; `User` adds none.
- **FR-007**: `useLocaleChoice` SHALL read `null` on the server and while hydrating, and nothing SHALL read the
  cookie to redirect (ADR 0297 decision 4).
- **FR-008**: Every source file SHALL carry the Stackra file contract, one exported declaration per file, TSDoc on
  every export; tests SHALL sit in `__tests__/` beside the subject and import from `@stackra/testing`.

## Success Criteria

- **SC-001**: Every symbol the template imports from `@stackra/i18n` and `@stackra/i18n/react` exists with the shape
  it uses (configs, generated `#stackra/i18n` samples, `root.tsx`, components and routes of web, mobile and console).
- **SC-002**: A test exists for every public symbol.
- **SC-003**: Each barrel test fails when an export is added or removed.

## Assumptions

- The provider reads `I18nConfig` with `useConfig`, so it sits inside `ContainerProvider`, as the generated
  `Contexts` does.
- A runtime that stores the locale choice (native, the console) passes `setLocale` to `I18nProvider`; persistence and
  catalogue loading are the runtime's (`@stackra/app`, W5).
- Endonyms are case data rather than `Intl.DisplayNames`, so they do not depend on a native runtime's Intl data.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
