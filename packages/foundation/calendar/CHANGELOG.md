# @stackra/calendar

## 0.1.0

### Minor Changes

- e3b8c19: Add `@stackra/calendar`, calendar mechanism over market-pack data: `hijriOf` and `gregorianOf` (Umm al-Qura through
  `Intl`), `instantOf` and `localDateOf` for time zones, `dayStatus` and `addBusinessDays` over the `BusinessCalendar`
  data a pack supplies (working week with hours, dated, yearly Gregorian and yearly Hijri holiday rules), with
  `uncertain` days for sighted Hijri holidays nobody has confirmed, `openIntervals` and `addWorkingMinutes` for working
  hours, `occurrences` for RRULE series that skip holidays, `findSlots` for bookings with processing gaps, and `ageOn`.
  `BusinessCalendar$` checks calendar data at the boundary. The package holds no calendar values of its own.
- e79892e: Add the `PrayerTimes` port and its `ComputedPrayerTimesDriver` (ADR 0414): the five prayer times and sunrise of a local
  date at a place, computed from the sun's position under a method that is market-pack data (`calendar.prayer_times`,
  read with `prayerMethodFromPack` and checked by `PrayerMethod$`: Fajr angle, Isha angle or minutes, Asr factor,
  Maghrib minutes and a `HighLatitudeRule`). Notifications use it for quiet hours.
- b89ae70: Support every RFC 5545 date and time part of RRULE (BYSETPOS, BYYEARDAY, BYWEEKNO, BYHOUR, BYMINUTE, BYSECOND, YEARLY
  BYDAY positions and UNTIL with a time) and refuse the rest with a reason (ADR 0387); add `CountMode` so COUNT can count
  only kept dates; add the `nth_weekday` holiday kind and the `observe` shift; read the calendar and the leap-birthday
  rule from market packs with `calendarFromPack` and `leapBirthdayFromPack`.
- 2babf37: Ship the `X$` schema of each contract type a shape field names (STA-1284): `Address$`, `ScopeRef$`, `Actor$`,
  `Signature$` and `SignerPublicKey$` from `@stackra/validation`; `IsoDate$`, `HijriDate$`, `WorkingWeek$` and the
  `WorkingWeek` type from `@stackra/calendar`; `CustomFieldDefinition$` and `CustomFieldValue$` from `@stackra/content`;
  `ImportChange$` and `RowError$` from `@stackra/data-transfer/contracts`; `PromotionDiff$` from
  `@stackra/settings/contracts`; `Audience$` from `@stackra/iam/contracts`. `Condition$` already ships from
  `@stackra/rules`.

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
- fd13f0e: Import the shared helpers from `@stackra/support` and delete the local copies (stackra-224): notifications
  (`base64url`, `htmlToText`), webhooks and licensing (`decodeBase64`; licensing also `isRecord`), rules (`isRecord`),
  data-transfer and identity (`crc32`), documents and experience (`escapeHtml`; experience's `./edge` and `./server`
  re-export support's), experience (`htmlToText`: the text part now has a blank line after each block, as notifications'
  did), seo and brand-kit (`escapeXml`; brand-kit now refuses a control character), market-packs (`canonicalJson`: the
  one canonical form, so integer-like keys sort as text), gen (`snakeCase`, `kebabCase`, `camelCase`, `pascalCase`),
  panel (`snakeCase`), calendar (`ageOn`, re-exported beside `LeapBirthday`) and identity (`ageOn`). Identity's
  `ActForOptions` gains `leapBirthday` (the market pack's 29 February rule; `march_1` when absent, the earlier
  behaviour). New dependency for each except licensing: `@stackra/support`.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [65f5ac1]
- Updated dependencies [c21a223]
- Updated dependencies [c1818fd]
- Updated dependencies [b88a78d]
- Updated dependencies [38ef655]
- Updated dependencies [914465a]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [9fc14fd]
- Updated dependencies [150fa18]
- Updated dependencies [fd13f0e]
- Updated dependencies [e756399]
- Updated dependencies [a55aa40]
- Updated dependencies [cbc545c]
- Updated dependencies [2787c1e]
- Updated dependencies [dacb5c2]
- Updated dependencies [fd13f0e]
- Updated dependencies [349db18]
- Updated dependencies [d19a3d5]
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/market-packs@0.1.0
  - @stackra/support@0.1.0

Written by Changesets on release; never edited by hand.
