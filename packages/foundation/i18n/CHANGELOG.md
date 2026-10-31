# @stackra/i18n

## 0.2.0

### Patch Changes

- Updated dependencies [9085c41]
  - @stackra/contracts@0.2.0
  - @stackra/money@0.2.0
  - @stackra/config@0.2.0
  - @stackra/support@0.2.0
  - @stackra/validation@0.2.0

## 0.1.0

### Minor Changes

- e1dde33: `@stackra/i18n/native` imports its Expo libraries itself (STA-1534): new `deviceLanguageTags()` and `deviceRegion()`
  read the phone's languages and region from expo-localization, so an app no longer passes `getLocales()` and
  `getCalendars()` in; `useLanguageSwitcher()` and `<LanguageSwitcher />` reload through expo-updates' `reloadAsync`
  unless a `reload` is passed, and on Android 13 and later open the per-app language screen (`APP_LOCALE_SETTINGS` for
  the app's package) through expo-intent-launcher. expo-localization, expo-updates, expo-intent-launcher and
  expo-constants are new optional peers.
- 6d04650: Native apps follow the phone's language and region (STA-1534). `I18nConfig.nativeSwitcher` (`NativeSwitcher`:
  `system`, the default, or `in_app`) decides who owns the language choice; `nativeSwitcherMode` runs `in_app` below
  Android 13. New `./native` entry with `useLanguageSwitcher()` and `<LanguageSwitcher />`: under `system` choosing opens
  the phone's language screen for the app, under `in_app` it switches through `setLocale` and, across right-to-left,
  flips the layout and calls the app's `reload`. New pure helpers `startingLocale`, `matchDeviceLocale` and
  `regionFormat` (the phone's region, clock, first weekday, units and time zone, with an account or business override);
  `I18nProvider` takes a `region` prop and `useDateTime` formats in its zone. React Native is a new optional peer.
- 2787c1e: Add `@stackra/i18n`: the `Locale` enum (`en`, `en-US`, `ar`, `ar-SA`, each with its endonym), `NumberingSystem`
  (Latin by default, Arabic-Indic, or the user's own) and `LocaleUrlStrategy`; `I18nConfig`, the configuration a member
  overrides with its locales, right-to-left set, fallback chains, digits and URL strategy, validated by its shipped
  `I18nConfig$`; the ICU engine `formatMessage` over namespaced catalogues, `mergeCatalogues` for regional overlays
  merged along the fallback chain, and `keys`, which builds the typed `I18nKey` tree gen writes into `#stackra/i18n`.
  `./react` adds `I18nProvider` and the hooks `useTranslation`, `useLocale`, `useLocaleChoice` (the visitor's remembered
  choice, never read to redirect), `useMoney`, `useNumber` and `useDateTime`, all in the active locale and digits.
- d9d5187: Ship the seven languages (STA-788, ADR 0403): `Locale` gains `es`, `es-US`, `it` and `nl`, and every case carries its
  default week start and clock. Add `HourCycle`, `LocaleFormat`, `localeFormat` and `I18nConfig.formats` (a per-locale
  override), build every Intl tag with the `hc` keyword, put the active format in the provider's state, and add
  `DisplayUnit` and `formatQuantity` for imperial display over metric storage.
- fd1a986: Add the `ar-AE`, `ar-EG`, `fr` and `de` locales (the Arabic overlays right-to-left by default), `normalizeArabic`,
  `withDigits`, `formatAddress`, `countryName`, `formatLength` with `LengthUnit` (cm and inches over `@stackra/support`'s
  exact `Quantity`), and a `./contracts` entry with the `TranslationProvider`, `Geocoder` and `AddressAutocomplete` ports
  (OS-182).
- c34bf79: `GeoPoint` has one home, `@stackra/contracts`. Breaking: `@stackra/rules/contracts`, `@stackra/shipping/contracts` and
  `@stackra/i18n/contracts` no longer export their identical copies; import `GeoPoint` from `@stackra/contracts` (STA-1383).
- 37e1aa8: Round C. gen: lazy catalogue loaders and `loadMessages(locale)` in the generated I18n (only runtime dependencies bring
  lang); event wire names stay `<module>.<name>.v<n>` and a prefixed name is refused (`event_name_prefixed`); a service
  subscribes its own topics into its inbox for local listeners; the coverage-audit refusals (`checkConventions` and
  friends). i18n: `loadMessages` with the ar-SA, ar, en fallback chain. Packages that ship `assets/lang` export
  `./assets/*`. tenancy: `belongsToTenant({ nullable: true })` compiles through `equalsOrUnset`. workflow: `ServiceAcked`
  carries `KeptRecords` (migration 0008). identity: app-approval sign-in and step-up with number matching and QR.
  filesystem: `readStream` on every disk. content: custom fields per runtime subtype (migration 0004); `ContentModule`
  exports `RevisionService`. actions: `RateLimitBudget` port sizes the area bucket. licensing: `LicenceIssuer` port with
  Keygen and memory drivers, install key signer and signed usage reports.

### Patch Changes

- 038966e: Rule-gap B-1, B-2 and B-5 (stackra-230, owner D11). `base.jsonc` now has no warn level left: the `suspicious`
  category and `react/exhaustive-deps` are `error`, and every warning they raised (81) is fixed or carries a reasoned
  disable. `unicorn/no-array-sort` is on (a bare `x.sort();` statement passes; tests are off), with
  `no-promise-executor-return`, `unicorn/prefer-code-point`, `unicorn/prefer-structured-clone` and `unicorn/prefer-spread`.
  
  The packages listed change no API. toSorted and toReversed are ES2023 and the base lib is ES2022, so a TypeScript site
  that sorts or reverses an array it just built carries a reasoned disable; the Node-only `.mjs` tools use toSorted.
  Promise executors have block bodies; `String.fromCharCode` is `String.fromCodePoint`; byte-level `charCodeAt`, hashes
  and deliberate JSON round trips keep their form with a reason; typed-array `.slice()` copies are `new Uint8Array(x)`.
- 0a7eaf1: Lint: the rule-gap B-3 autofix sweep (stackra-231, owner D11). `@stackra/oxlint-config` turns on
  `unicorn/numeric-separators-style`, `unicorn/switch-case-braces`, `unicorn/prefer-string-replace-all` and
  `unicorn/catch-error-name` at `error`. `unicorn/number-literal-case` stays off: it wants uppercase hex digits and oxfmt
  prints them lowercase, so the two would fight.
  
  The packages listed change no API and no behaviour. Long numeric literals carry `_` separators, every `case` body is a
  block, `.replace(/x/g, ...)` is `.replaceAll(...)` (a plain string where the pattern was a plain string), and a caught
  error is named `error`, or `<name>Error` where an outer `error` is in scope. Log and error `cause` fields keep their key.
- 2612a7e: One rounding vocabulary (STA-1383). Breaking: `Rounding` moves from `@stackra/money` to `@stackra/contracts` (same
  four codes, same order); import it from `@stackra/contracts`. `@stackra/support`'s `QuantityRounding` stays a
  dependency-free union and is documented, and type-tested in money, as the `down`, `up` and `half_up` subset of it.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [c56d7fe]
- Updated dependencies [2787c1e]
- Updated dependencies [5fe0327]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [a55aa40]
- Updated dependencies [cbc545c]
- Updated dependencies [2787c1e]
- Updated dependencies [dacb5c2]
- Updated dependencies [fd13f0e]
- Updated dependencies [349db18]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/config@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/money@0.1.0
  - @stackra/support@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
