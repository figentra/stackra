# @stackra/support

## 0.2.0

No changes in this release.

## 0.1.0

### Minor Changes

- a55aa40: Add `canonicalJson` and `canonicalHash`, the one canonical form (sorted keys, `undefined` dropped, ISO dates) and its
  SHA-256 that hash chains, signed checkpoints and content addresses share, byte for byte the form
  `@stackra/access-log` already chains over (ADR 0416); and `time.addMonths` / `time.subMonths`, calendar-month shifts on
  the UTC calendar with the day clamped to the month's end, for billing periods.
- cbc545c: Breaking: `OneTimeCodeRecord` of `@stackra/support` (the key-id record of `oneTimeCode`) is renamed
  `KeyedOneTimeCodeRecord`, so it no longer collides with `@stackra/validation`'s purpose-bound `OneTimeCodeRecord`
  (STA-1383).
- 2787c1e: New package of dependency-free helpers, starting with `time`: add or subtract seconds, minutes, hours or days from an
  instant and get a new `Date` back, without hand arithmetic and without reading the clock or the host time zone.
- dacb5c2: Add `Quantity`, an amount with a unit and exact conversions and arithmetic over big-integer fractions;
  `restrictedGtin` for GS1 restricted-circulation numbers; and `code128`, a Code 128 and GS1-128 encoder. The `.` entry
  is now a stand-in barrel.
- fd13f0e: One home for the helpers other packages had copied (stackra-224, owner D10): `base64url` is now public (encodes an
  `ArrayBuffer` too, decodes padded text), and new `decodeBase64` (never throws, `undefined` for bad text), `crc32`
  (bytes or a string, chunked), `escapeHtml`, `escapeXml` (refuses characters XML 1.0 cannot carry), `htmlToText`,
  `isRecord(value, keys?)`, `snakeCase`, `kebabCase`, `camelCase`, `pascalCase` and `ageOn(birth, on, leapBirthday)`
  with calendar's 29 February rule (`february_28` or `march_1`, no default). README and AGENTS list them.
- 349db18: Add `signedToken` (`sign`, `verify`: purpose, expiry, key id and JSON data under HMAC-SHA-256) and `oneTimeCode`
  (`issue`, `verify`: single-use numeric codes stored as a peppered HMAC with expiry and attempts, constant-time
  verify), both over a `SigningKeySource` that the `KeyProvider` of `@stackra/contracts` satisfies structurally (no new
  dependency). `Quantity` gains `roundTo(step, mode)` and `priceMinor(pricePerMinor, per, mode)` (whole minor units, no
  float). New types `SigningKeySource`, `SignedTokenCheck`, `OneTimeCodeRecord`, `OneTimeCodeCheck`, `QuantityRounding`.
  No existing export changes (STA-934).

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
- abb1d69: Lint: rule-gap B-4 (stackra-232, owner D11). `@stackra/oxlint-config` turns on
  `typescript/method-signature-style` with `"property"` at `error`. A method signature in an interface or type literal is
  checked bivariantly even under `strictFunctionTypes`, so a driver could accept a narrower argument than its port
  promises. Every port, type and augmentation in the packages listed now spells its members as properties
  (`find: (id: string) => Promise<T>`), which TypeScript checks strictly.
  
  No runtime change. The type surface is stricter: an implementation, fake or object literal whose parameter is narrower
  than the port's now fails to typecheck, as it always should have. Module augmentations (`Matchers<R>`, `Blueprint`,
  `TestingModuleBuilder`, `TestingApp`) use the same property form.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
- 2612a7e: One rounding vocabulary (STA-1383). Breaking: `Rounding` moves from `@stackra/money` to `@stackra/contracts` (same
  four codes, same order); import it from `@stackra/contracts`. `@stackra/support`'s `QuantityRounding` stays a
  dependency-free union and is documented, and type-tested in money, as the `down`, `up` and `half_up` subset of it.
- e756399: Publish to the Stackra registry (ADR 0453): every free `@stackra/*` package is `"private": false` (ADR 0461) with `publishConfig` `{ access: public, provenance: true }` and no registry of its own; the release workflow's `registry` input, `https://npm.stackra.figentra.com/`, is the one place it is set. The packed manifest drops the repo-only `@stackra/source` export condition. `@stackra/runway` types `providers.npm` (`registry`, `scope`); `@stackra/repo-checks` refuses a member `publishConfig.registry`; `stackra new` writes none.

Written by Changesets on release; never edited by hand.
