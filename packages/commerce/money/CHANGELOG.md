# @stackra/money

## 0.1.0

### Minor Changes

- c56d7fe: Add `roundCash` and an `optional` flag on `CashRoundingRule`: an optional row (the US 5-cent rule) rounds a cash total
  only when the tenant turned cash rounding on.
- 2787c1e: Add `@stackra/money`: `Money` holds an amount in whole minor units of one ISO 4217 currency (`Money.ofMinor`,
  `Money.of("12.50", "USD")`), `Money.zero` and `Money.max`, with exact `plus`, `minus`, `times` and `divide`, one explicit `Rounding` per
  operation (`Down`, `Up`, `HalfUp`, `HalfEven`, half-even by default), `allocate` that never loses a minor unit, and
  `toDecimal()` with the currency's own exponent. Amounts beyond `Number.MAX_SAFE_INTEGER` and mixed currencies are
  refused. The `money()` and `currencyCode()` codecs that generated schemas use now ship from this package, with
  `CurrencyCode` as the union of ISO 4217 codes.
- 5fe0327: Add exchange and metal rates, cash rounding and 6-decimal unit prices: the `RateSource` port with `RatePair` and
  `RateSnapshot` in a new `./contracts` entry, `ExchangeRate` (`convert` across exponents, `priceOf` a commodity quantity),
  `MemoryRateSourceDriver`, `CashRounding` over a market pack's cash rounding row (`CashRoundingRule`), `UnitPrice` held in
  millionths, and the exact `decimalProduct`. `Money#times` and `Money#divide` also take a decimal string.
- 2612a7e: One rounding vocabulary (STA-1383). Breaking: `Rounding` moves from `@stackra/money` to `@stackra/contracts` (same
  four codes, same order); import it from `@stackra/contracts`. `@stackra/support`'s `QuantityRounding` stays a
  dependency-free union and is documented, and type-tested in money, as the `down`, `up` and `half_up` subset of it.

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
- a3d23d9: Rule-gap B-7 (stackra-234): `typescript/explicit-module-boundary-types` at error for packages; apps, workers, tools,
  build scripts, tests, stories and e2e specs are off.
  
  The other packages: no behaviour change. Exported functions and public class members now spell the return type they
  already had: components return `ReactElement` (or `ReactElement | null`), panel overrides their base's node type,
  Pulumi helpers an object type of their resources, and zod factories their schema type. `tableInput` keeps its inferred
  schema type with a reasoned disable.
- 65f5ac1: Turn on the rule-gap cheap set (stackra-229, owner D11): `@stackra/oxlint-config` adds `no-console` for package
  source, the `ban-ts-comment` rules (`@ts-expect-error` only in tests, with a description), about 30 bug-catchers and
  autofixes at error, and the react, jsx-a11y and small React rules on every `.tsx` file. The other packages fix the
  sites these rules flag: `Set` lookups, date clones, merged imports, explicit button types, stable default props and
  reasoned disables. `twiml`, `renderHtml` and `resolveDocument` now throw a `TypeError` on an unknown instruction or
  block kind instead of emitting nothing for it.
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
- Updated dependencies [914465a]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [150fa18]
- Updated dependencies [e756399]
- Updated dependencies [d19a3d5]
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0

Written by Changesets on release; never edited by hand.
