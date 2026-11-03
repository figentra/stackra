# Feature Specification: `#stackra/i18n` locale prefixes from I18nConfig

**Feature Branch**: `figentra/sta-2065-i18n-locale-prefixes`

**Created**: 2026-11-03

**Status**: Draft <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-2065

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: User description: "Work package wp-10 of the gen coverage path (gap H-14): `#stackra/i18n` has no locale
prefixes and ignores I18nConfig. Gen reads the member's I18nConfig and writes each configured locale's URL prefix,
lowercase (ADR 0297 decision 4), so the router tree's `toRoot({ prefixes })` has its input."

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none by hand. Every member that gets `.stackra/gen/i18n.ts` (gitignored) gains one export,
  `prefixes`.
- **Services touched**: none
- **Packages touched**: packages/developer/gen (owner of this spec)
- **Public contract change**: additive: the generated `#stackra/i18n` module exports `prefixes`, the URL prefix of
  each configured locale. `I18n`, `locales`, `catalogues` and `loadMessages` are unchanged.
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none (build-time text; no request, cookie or header is read)
- **Secrets**: none
- **ADR needed**: no (implements ADR 0297 decision 4 and the `I18nConfig.urlStrategy` field as written)
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none (the router tree that mounts the prefixes is wp-70)
- **Docs to update**: `packages/developer/gen/README.md` (the `emitI18n` row and the `.stackra/gen/i18n.ts` row)
- **Lane**: full
- **Change risk**: R1 (one new generated export; existing exports and callers unchanged)

## Glossary _(full lane)_

- **I18nConfig override**: a member's `src/config/i18n.config.ts`, a class that extends `I18nConfig` of
  `@stackra/i18n` (imported as `BaseI18nConfig`) and sets `override` field defaults only (ADR 0305 rule 1). Gen sees it
  as a `config` shape whose base is the package class `I18nConfig` from `@stackra/i18n`.
- **Configured locales**: `I18nConfig.locales` (base default `[Locale.En]`), the locales the member serves.
- **Default locale**: `I18nConfig.defaultLocale` (base default `Locale.En`).
- **URL strategy**: `I18nConfig.urlStrategy`, `prefix_except_default` (base default: the default locale unprefixed) or
  `prefix` (every locale under its tag).
- **Locale prefix**: the first URL segment of a locale's mount, `/` plus its lowercase BCP 47 tag (`ar-SA` is
  `/ar-sa`), or `""` for an unprefixed default locale. This is the shape `toRoot({ prefixes })` of
  `@stackra/navigation` accepts (it throws on anything else).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - The router gets each configured locale's prefix (Priority: P1)

A member that serves `en` and `ar-SA` sets them in its I18nConfig override. After `stackra gen`, `import { prefixes }
from "#stackra/i18n"` gives `{ en: "", "ar-SA": "/ar-sa" }`, which the generated router tree hands to `toRoot`.

**Why this priority**: H-14 is the only gap of this package, and the router tree package (wp-70) needs this input.

**Independent Test**: run `emitI18n` over IR fixtures with and without an I18nConfig override; run the
`i18n-packages` golden fixture and compare the expected `.stackra/gen/i18n.ts`.

**Acceptance Scenarios**:

1. **Given** an I18nConfig override with `locales = [Locale.En, Locale.ArSa]`, **When** gen runs, **Then**
   `.stackra/gen/i18n.ts` exports `prefixes = { "en": "", "ar-SA": "/ar-sa" }`.
2. **Given** an override that also sets `urlStrategy = LocaleUrlStrategy.Prefix`, **When** gen runs, **Then** the
   default locale is prefixed too: `{ "en": "/en", "ar-SA": "/ar-sa" }`.
3. **Given** no I18nConfig override, **When** gen runs, **Then** `prefixes` is the base config's: `{ "en": "" }`.
4. **Given** an override with `defaultLocale = Locale.Ar` and `locales = [Locale.En, Locale.Ar]`, **When** gen runs,
   **Then** `ar` is unprefixed and `en` is `/en`.

---

### Edge Cases

- **EC-01**: A member with no lang namespace, or one that does not declare `@stackra/i18n`, still gets no
  `#stackra/i18n` file (as today).
- **EC-02**: A regional overlay tag is lowercased whole (`ar-SA` → `/ar-sa`, `en-US` → `/en-us`); the key stays in BCP
  47 case.
- **EC-03**: A field the override does not set, or sets to a value gen cannot read as a constant, takes the base
  default (`locales` `["en"]`, `defaultLocale` `"en"`, `urlStrategy` `"prefix_except_default"`), as
  `emitExpoConfig` already does for `I18nConfig.locales` and `rtl`.
- **EC-04**: `locales` keeps listing the locale folders the member ships catalogues for; a package that ships ten
  catalogue languages and has no override keeps them all in `locales`, while its `prefixes` is `{ "en": "" }`.
- **EC-05**: A default locale that is not among the configured locales gets no entry; `I18nConfig$` refuses that
  config at boot (`checkI18nOptions`), so gen writes no prefix for it and adds no refusal of its own.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: WHEN gen writes `.stackra/gen/i18n.ts` THE `emitI18n` function SHALL export `prefixes`, an object with
  one entry per configured locale in the configured order, keyed by the locale's BCP 47 tag.
- **FR-002**: THE value of each `prefixes` entry SHALL be `""` for the default locale under `prefix_except_default`,
  and otherwise `/` plus the locale's tag in lowercase.
- **FR-003**: WHEN the member has an I18nConfig override THE `emitI18n` function SHALL read `locales`,
  `defaultLocale` and `urlStrategy` from its field defaults, and SHALL take the base default for a field the override
  does not set.
- **FR-004**: THE lookup of a host override's field default SHALL be one shared function that `emitI18n` and
  `emitExpoConfig` both call, so the two read I18nConfig the same way.

### Key Entities _(include if feature involves data)_

- **`prefixes`** (generated): `Readonly<Record<string, string>>`, locale tag to `""` or `/<lowercase tag>`.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN gen runs over the golden `i18n-packages` fixture, whose member configures `en` and `ar-SA`, THE
  generated `.stackra/gen/i18n.ts` SHALL export `prefixes` with `"en": ""` and `"ar-SA": "/ar-sa"` (lowercase, ADR 0297).
- **AC-002**: WHEN the I18nConfig override sets `urlStrategy` to `prefix` or another `defaultLocale` THE generator
  SHALL prefix or unprefix the locales accordingly, and WHEN no override exists THE generator SHALL write the base
  config's `{ "en": "" }`.

## Success Criteria _(mandatory)_

- **SC-001**: the unit tests of `emitI18n` cover FR-001 to FR-003 and EC-01 to EC-04, and the tests of
  `emitExpoConfig` still pass over the shared lookup (FR-004) — verified by: unit
- **SC-002**: the `i18n-packages` golden fixture writes the expected `prefixes` — verified by: unit (golden runner)
- **SC-003**: `pnpm verify` is green for `@stackra/gen` on ci-box — verified by: manual

## Out of scope

- The router tree that consumes `prefixes` (`toRoot`, `toLayout`, `toRoute`, G-22, wp-70).
- Sub-folder markets in the first segment (ADR 0297 decision 4, second clause): no config field declares a market yet.
- Per-locale prerender lists (H-34) and checking derived i18n keys (G-104, wp-99).
- Changing what `locales` lists (EC-04) or adding loaders for configured locales that ship no file.
- Recording config defaults in a package's manifest so gen stops mirroring the base defaults (the existing shortcut
  in `emitExpoConfig`).

## Assumptions

- The I18nConfig override is read the way `emitExpoConfig` already reads it: a `config` shape whose base is the
  package class `I18nConfig` from `@stackra/i18n` (or a subpath), and an enum-case default (`Locale.ArSa`) is recorded
  as its wire value (`"ar-SA"`) by the reader (`FieldDefault.value`, ADR 0294 decision 26).
- `prefixes` keyed by locale matches `toRoot`'s `Record<string, string>` and its tests (`{ en: "", ar: "/ar" }`);
  `toRoot` reads only the values, so the key form is free and BCP 47 case keeps it equal to `locales`.
- Every member with `#stackra/i18n` gets `prefixes`, not only apps: it is data, costs one line, and the acceptance
  names the `i18n-packages` fixture, which is a package.

## Amendments

None.

## Status history

- 2026-11-03 · — → Draft · Claude (STA-2065 session) · created
