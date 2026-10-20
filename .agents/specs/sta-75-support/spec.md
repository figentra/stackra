# Feature Specification: `@stackra/support`, pure helpers ported from Figentra OS with Laravel-style additions

**Feature Branch**: `figentra/sta-75-support-spec`

**Created**: 2026-10-20

**Status**: Draft <!-- Draft → Clarified → Planned → Ready → Implementing → Verified, or Abandoned / Superseded; spec-gate ci checks the artifacts each stage needs -->

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

<!-- Folder: .agents/specs/sta-n-<slug>/, named by the Linear key below (ADR 0120 D1). -->

**Linear**: STA-75

**Linear project**: Foundation kernel

**Clarifications status**: pending

**Input**: User description: "Port `@figentra-os/support` to `@stackra/support` (roadmap W1.1, ADR 0084 row: port + adapt). Add Laravel-style helpers now, keep it dependency-free, and docblock every file and export (owner decision Round 8 F2)."

## Impact _(mandatory, answer every line before /speckit.clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/foundation/support (new member; the `foundation` category folder already exists empty, ADR 0028)
- **Cross-service events**: none
- **Tenancy and data**: none (pure functions, no storage, no tenant context)
- **Secrets**: none
- **ADR needed**: yes: the package design record for an adapt row (ADR 0018, roadmap "Common definition of done"), naming the ported surface, the added Laravel-style helpers and what was left out
- **New dependencies**: none at runtime (ADR 0084 row "stays dependency-free"); dev dependencies only from existing catalogs (`tsdown`, `vitest`, `@vitest/coverage-v8`, the `@stackra/*-config` presets)
- **Deploy modes**: same in all three; the package makes no outbound call, reads no environment, host locale or clock, and needs no hosted service (ADR 0076)
- **Lane**: full (roadmap W1.1 row; a new package is R2, ADR 0120 D4)
- **Change risk**: R2 (a new package with a public contract; no auth, tenancy, secrets or outbound HTTP, so not R3; ADR 0120 D16)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Use the ported Figentra OS helpers under the Stackra name (Priority: P1)

A package author in the kernel (container, config, logger, events) imports the helpers that Figentra OS packages
already use (`retry`, `timeout`, `compose`, `stableStringify`, `slugify`, `groupBy`, `duration`, `Clock`) from
`@stackra/support/<concern>` and gets the same behaviour as the source, with Stackra docblocks and `STK` codes.

**Why this priority**: W1.2 ports (container, config, logger) import these helpers; without them nothing downstream
ports cleanly. It is the MVP on its own.

**Independent Test**: The source suites in `src/{str,arr,time,async,pipeline,object}/__tests__/` run
green against the ported package unchanged except for import paths and codes, and the built `dist` passes the same suite.

**Acceptance Scenarios**:

1. **Given** the package is built, **When** a consumer imports `retry` and `timeout` from `@stackra/support/async`,
   **Then** they resolve from `dist/*.mjs` with `.d.mts` types and behave as in the source README example.
2. **Given** `timeout()` expires, **When** the caller catches the error, **Then** it is a `TimeoutError` whose `code`
   is an `STK`-prefixed diagnostic code and whose `ms` is the expired deadline.
3. **Given** a middleware calls `next()` twice, **When** `compose()` runs it, **Then** it rejects with a
   `PipelineError` carrying an `STK` code, as the source does today with its own code.

---

### User Story 2 - Reach for Laravel-style helpers instead of hand-rolling them (Priority: P2)

A service or package author used to Laravel's `Illuminate\Support` (`Str::after`, `Arr::get('a.b')`, `tap`,
`blank`) finds the equivalent pure function under the matching entry, documented with an example, instead of
writing a local helper or adding lodash.

**Why this priority**: The owner asked for these now (Round 8 F2), and the code-standards steward treats a
hand-rolled helper as a finding when a house helper exists. It is not needed for W1.2 to port.

**Independent Test**: Each added helper has unit cases covering its Laravel-documented behaviour and the edge cases
below; importing one helper does not pull in the others (tree-shaking check on a one-import bundle).

**Acceptance Scenarios**:

1. **Given** `{ a: { b: [{ c: 1 }] } }`, **When** `dataGet(obj, "a.b.0.c")` is called, **Then** it returns `1`, and
   `dataGet(obj, "a.x", "d")` returns `"d"`.
2. **Given** `"Hello World"`, **When** `after("Hello World", "Hello ")` is called, **Then** it returns `"World"`, and
   with a missing needle it returns the subject unchanged (Laravel semantics).
3. **Given** `"  "`, `[]`, `{}`, `null` or `undefined`, **When** `blank(value)` is called, **Then** it returns `true`;
   for `0`, `false` and `"0"` it returns `false`.

---

### User Story 3 - Read any export and know what it does (Priority: P3)

An agent or contributor opens any file in the package and finds a Stackra file-contract block and an export
docblock that states what the type does not: units, locale, side effects, `@throws`.

**Why this priority**: Required by ADR 0084 decision 1 and ADR 0007, and named in the roadmap "Done when"; it does
not change behaviour, so it ranks after the code.

**Independent Test**: The planned docblock check (ADR 0084 Enforcement) or, until it exists, a review pass finds no
file without the four contract fields and no export without TSDoc.

**Acceptance Scenarios**:

1. **Given** any `src/**/*.ts` file outside `__tests__/`, **When** it is read, **Then** it opens with `Purpose`,
   `Boundary`, `Runtime` and `Governing contract` fields (ADR 0007 decision 1), replacing the source's
   `Purpose/Scope/Owner/Secrets` block.
2. **Given** an exported function that can throw, **When** its TSDoc is read, **Then** it lists each error under
   `@throws` with its `STK` code.

### Edge Cases

- `formatRelative`, `formatDate` and `formatNumber` on Hermes (React Native): `Intl.RelativeTimeFormat` support varies
  by engine build. The helpers take the locale as an argument and never polyfill; a missing `Intl` API surfaces as the
  engine's own error, documented under `@throws`.
- `duration.days(n)` is 24 h with no DST awareness (source behaviour, kept and documented).
- `slugify` on non-Latin input (Arabic): the source strips diacritics via NFKD; characters outside `[a-z0-9]` are
  dropped. The result can be empty; the doc states it, the caller decides the fallback.
- `dataGet`/`dataSet` with a key containing a literal dot, a `__proto__`, `constructor` or `prototype` segment:
  `dataSet` refuses prototype-polluting segments; `dataGet` returns the default.
- `retry` with `attempts: 0` or a negative number, and an already-aborted `AbortSignal`: rejects at once, no call made.
- `chunk` with size `0` or a non-integer: throws a typed error rather than looping.
- `stableStringify` on cycles, `BigInt` and `undefined` members: behaviour kept from the source and documented.

## Requirements _(mandatory)_

### Functional Requirements

Ported surface (source: `/Users/akouta/Projects/figentra/packages/os/foundation/support`, README and `src/*/index.ts`):

- **FR-001**: The package SHALL ship as `@stackra/support` in `packages/foundation/support` with no root (`.`) entry
  and one subpath entry per concern: `./str`, `./arr`, `./time`, `./async`, `./pipeline`, `./object`, as the source
  does (ADR 0084 row; ADR 0083 names). [NEEDS CLARIFICATION: FW1 — recommended: a (entries first); support keeps its
  per-concern subpaths as its declared entries, since FW1 a's fixed entry names do not fit a helper library]
- **FR-002**: `./str` SHALL export `slugify`, `kebabCase`, `camelCase`, `pascalCase`, `snakeCase`, `truncate` and
  `fill` with the source behaviour.
- **FR-003**: `./arr` SHALL export `groupBy`, `uniqueBy`, `partition`, `sortBy` (stable, multi-key), `chunk` and the
  type `SortKey`.
- **FR-004**: `./time` SHALL export `duration`, the `Clock` interface, `systemClock`, `formatRelative`, `formatDate`
  and `formatNumber`; each formatter SHALL take the locale as an explicit argument and SHALL NOT read the host locale or
  time zone (source README; ADR 0076).
- **FR-005**: `./async` SHALL export `sleep`, `timeout`, `retry`, `singleFlight`, `defer`, `TimeoutError` and
  `RetryOptions`; every waiting helper SHALL accept an `AbortSignal`.
- **FR-006**: `./pipeline` SHALL export `compose`, `Middleware`, `Terminal` and `PipelineError`.
- **FR-007**: `./object` SHALL export `EMPTY_ARRAY`, `EMPTY_OBJECT`, `stableStringify`, `pick`, `omit` and
  `isPlainObject`.

Port conventions (ADR 0084 decision 1):

- **FR-008**: Every source file SHALL open with the ADR 0007 contract block, and every export SHALL carry TSDoc with a
  purpose sentence and `@param`, `@returns`, `@throws` where the type does not say it (ADR 0007 decision 2; Round 8 F2).
- **FR-009**: The package SHALL keep one export per file, use `#` subpath imports internally, and contain no `any`,
  non-null assertion or `enum` (ADR 0006; ADR 0084 decision 1).
- **FR-010**: WHEN a helper throws, the error SHALL carry a `code` from the package's diagnostics catalogue prefixed
  `STK` (ADR 0084 decision 1; owner decision X3), replacing the source's bare codes such as `"timeout"`.
- **FR-011**: The package SHALL have zero runtime `dependencies` and zero `peerDependencies`, and SHALL NOT import
  `@stackra/contracts` or any other workspace package (roadmap W1.1 "Depends on: none"; ADR 0084 row). Errors are
  plain `Error` subclasses; mapping them to the contracts error kinds is the caller's job (FW7, assumed a).
- **FR-012**: The package SHALL NOT read globals that differ by host: no `process`, `window`, `document`, `Date.now()`
  outside `systemClock`, `Math.random()` outside an injectable RNG parameter, so it runs unchanged in Node, Encore,
  browsers, workers and React Native (ADR 0076; source README "no globals").
- **FR-013**: The package SHALL build with tsdown to ESM-only `dist/*.mjs` and `.d.mts`, with each `exports` entry
  listing the `@stackra/source` condition first (ADR 0025 decision 3), and SHALL be licensed MIT (ADR 0024).
- **FR-014**: Tests SHALL sit in `src/<concern>/__tests__/<subject>.test.ts` (ADR 0022) and SHALL meet the coverage
  floor. [NEEDS CLARIFICATION: TS3 — recommended: a (80% lines and functions, 70% branches for support)]

Laravel-style additions (Round 8 F2; modelled on `Illuminate\Support\Str`, `Arr` and the global helpers, as free
functions, not static classes, matching the source's "no base classes"):

- **FR-015**: `./str` SHALL add `after`, `afterLast`, `before`, `beforeLast`, `between`, `headline`, `lcfirst`,
  `ucfirst`, `mask`, `squish`, `wrap`, `unwrap`, `replaceFirst`, `replaceLast`, `start`, `finish`, `words` and `is`
  (wildcard match), each with the semantics of the Laravel method of the same name.
- **FR-016**: `./arr` SHALL add `dataGet`, `dataSet`, `dataHas`, `dataForget` (dot-notation paths over objects and
  arrays), `dot`, `undot`, `wrap`, `flatten` (with depth), `keyBy`, `pluck`, `countBy`, `first`/`last` (with predicate
  and default), `sole`, `crossJoin` and `zip`.
- **FR-017**: WHEN `dataSet` or `undot` receives a path segment `__proto__`, `constructor` or `prototype`, THEN it
  SHALL throw an `STK`-coded error and SHALL NOT mutate any prototype.
- **FR-018**: A new entry SHALL export the value helpers `tap`, `value`, `blank`, `filled`, `rescue`, `transform` and
  `once`, with Laravel's semantics for blank and filled (whitespace-only strings, empty arrays and empty plain objects
  are blank; `0`, `false` and `"0"` are filled). The entry name is set in clarify (proposed `./fn`; FW1 above).
- **FR-019**: The package SHALL NOT add helpers that need a dependency, locale data or a random source by default:
  `Str::plural`/`singular` (belongs to i18n, ADR 0080), `Str::uuid`/`ulid` (public ids belong to contracts,
  ADR 0082), and a fluent `Collection`/`Stringable` class.
- **FR-020**: Each added helper's docblock SHALL include a short example and name its Laravel counterpart.

### Key Entities

- **Entry**: one public subpath (`./str` …); declares only the helpers of one concern; no entry imports another entry
  except through `#` internals.
- **Diagnostic code**: a stable `STK`-prefixed string on every thrown error, listed in the package's catalogue.
- **Clock**: the port `{ now(): number }` that time-dependent code takes instead of reading the system time.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of the 36 source exports listed in FR-002 to FR-007 exist under `@stackra/support` with the same
  signatures, and every ported source test case passes.
- **SC-002**: `pnpm verify` is green on the merge commit (format, lint, typecheck, test, build, validate, boundaries,
  knip).
- **SC-003**: The published `package.json` lists 0 `dependencies` and 0 `peerDependencies`.
- **SC-004**: 0 files under `src/` lack the contract block, and 0 exports lack TSDoc.
- **SC-005**: 0 thrown errors carry a code that does not start with `STK`.
- **SC-006**: A bundle importing only `slugify` contains no code from `./async`, `./arr` or `./time`.
- **SC-007**: The same test suite passes under Node and under a browser-like environment, with no host globals
  stubbed.

## Assumptions

- `foundation` is the category (ADR 0084 places support there; FW2 does not affect it).
- The source errors (`TimeoutError`, `PipelineError`) stay in support as plain `Error` subclasses; support cannot
  depend on contracts, which also ships in W1.1.
- The Laravel helper list in FR-015 to FR-018 is this draft's proposal from what the source lacks; clarify may trim it.
  No questionnaire item covers it.
- Relicensing to MIT on port (ADR 0024, ADR 0084 context) is part of this change.
- A docs page and a changeset ship with the implementation (roadmap "Common definition of done").

## Glossary

- **Port + adapt**: copy the Figentra OS package, rename to `@stackra/*`, apply the ADR 0084 conventions and the
  row's stated changes (ADR 0084 decision 2).
- **Laravel-style helper**: a pure free function named and behaving like a method of Laravel's `Str`, `Arr` or global
  helpers.
- **Dot-notation path**: a string such as `"a.b.0.c"` addressing nested object keys and array indexes.
- **Blank / filled**: Laravel's emptiness test (`blank()`), and its negation (`filled()`).
- **STK code**: the Stackra diagnostic prefix that replaces Figentra's `FCN` (ADR 0084 decision 1, X3).
- **Entry**: a public `exports` subpath of the package.

## Open items

- [NEEDS CLARIFICATION: FW1 — recommended: a (entries first); support's declared entries are its per-concern subpaths
  `./str`, `./arr`, `./time`, `./async`, `./pipeline`, `./object`, plus the new value-helper entry] (FR-001, FR-018)
- [NEEDS CLARIFICATION: TS3 — recommended: a (80% lines and functions, 70% branches; support is not in the 90/80
  list)] (FR-014)
- The Laravel helper list (FR-015 to FR-018) is a proposal for the owner to confirm in clarify; it has no question ID.
