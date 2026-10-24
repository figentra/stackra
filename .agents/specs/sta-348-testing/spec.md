# Feature Specification: `@stackra/testing`, the generic test kit (`.` entry)

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

**Linear**: STA-348

**Linear project**: none

**Clarifications status**: complete

**Analyze**: — <!-- lite lane: /speckit.analyze not run -->

**Input**: Framework build-out, wave 1a (STA-348): build `@stackra/testing` with its `.` entry only, merged first in
wave 1a so `@stackra/contracts` and `@stackra/support` test through it. Source of truth: ADR 0269 (entries, what `.`
holds, helper placement, mock hoisting), ADR 0127 with its 2026-10-24 note (placement in `developer`, allowed
entries), ADR 0294 and 0305 (grammar, one declaration per file, kind base names), ADR 0022 (test placement) and the
consumer template's imports from `@stackra/testing`.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: new `packages/developer/testing` (`@stackra/testing`)
- **Public contract change**: new package; the `.` entry exports the vitest runner objects and `Fake`,
  `createMatcher`, `factory`, `freezeClock`, `freezeIds`, with the types `Matchers`, `FakeConstructor`,
  `FakeRecorder`, `FactoryDefaults`, `FixtureBuilder`
- **Cross-service events**: none
- **Tenancy and data**: none
- **Security and privacy**: none; test-only code, no personal data
- **Secrets**: none
- **ADR needed**: no; implements ADR 0269 as accepted
- **New dependencies**: none new; `vitest` (already catalogued in `quality`) becomes a peer dependency
- **Deploy modes**: none; a test kit, never deployed
- **Licence tier**: MIT, published to npmjs with provenance (ADR 0177)
- **Docs to update**: `packages/developer/testing/README.md`, `packages/developer/testing/AGENTS.md`; ADR 0022, 0127, 0177, 0269, 0294, 0305 are cited and amended only by a note if a decision here changes
- **Lane**: lite (recorded reason: one small test-only kit in one package, set by ADR 0269)
- **Change risk**: R2 (a new package; test-only code, no data or credentials)
- **Branch members**: this branch (STA-348) also changes `packages/application/actions`, `packages/application/registry`, `packages/commerce/money`, `packages/commerce/pricing`, `packages/communication/versioning`, `packages/cross-cutting/seo`, `packages/data/assets`, `packages/data/filesystem`, `packages/data/model`, `packages/data/state-machine`, `packages/data/storage`, `packages/developer/cli`, `packages/developer/coding-standard`, `packages/developer/devtools-kit`, `packages/developer/gen`, `packages/developer/mcp`, `packages/developer/renderers`, `packages/developer/runway`, `packages/developer/skills`, `packages/developer/vite-plugin`, `packages/experience/platform`, `packages/experience/shortcuts`, `packages/foundation/config`, `packages/foundation/container`, `packages/foundation/contracts`, `packages/foundation/errors`, `packages/foundation/events`, `packages/foundation/i18n`, `packages/foundation/logger`, `packages/foundation/support`, `packages/foundation/transport`, `packages/foundation/validation`, `packages/runtime/app`, `packages/runtime/cache`, `packages/runtime/devices`, `packages/runtime/realtime`, `packages/security/consent`, `packages/security/csp`, `packages/security/entitlements`, `packages/security/licensing`, `packages/state/coordinator`, `packages/state/feature-flags`, `packages/state/state`, `packages/state/theming`, `packages/tooling/oxlint`; spec-trace names every member of the diff, and each sibling package has its own `sta-348-*` spec or is outside this spec's scope

## Clarifications

### Session 2026-10-24

The package follows the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- ADR 0269 sets the entries, what `.` holds, helper placement and mock hoisting; ADR 0127 with its 2026-10-24 note places the package in `developer` with the allowed entries; the consumer template's imports from `@stackra/testing` are the shape contract.

## User Scenarios

### US1 — a package tests through one kit (P1)

A package author imports `describe`, `it`, `expect`, `vi` and the hooks from `@stackra/testing`, freezes the clock and
ids, and mocks a module with `vi.mock`.

**Acceptance**: the imports resolve to vitest's own objects; `vi.mock` hoists; the clock and ids are deterministic in
the test and real again afterwards.

### US2 — a package ships fakes, matchers and fixtures (P1)

A package author writes `x.fake.ts` on `Fake.of(Port)`, `x.matcher.ts` with `createMatcher` and a `Matchers`
augmentation, and `x.fixture.ts` with `factory<T>()`, exactly as the template does.

**Acceptance**: every template use compiles and behaves as its docblock says.

## Requirements

- **FR-001**: `.` re-exports vitest's own `describe`, `it`, `test`, `expect`, `vi`, `beforeAll`, `beforeEach`,
  `afterAll`, `afterEach`, `onTestFinished` and `expectTypeOf`, never copies, with vitest as a peer dependency.
- **FR-002**: `vi.mock` hoists above the imports when `vi` is imported from `@stackra/testing` (ADR 0269 decision 4);
  a test in this package proves it, and its failure stops the work and goes to the owner.
- **FR-003**: `freezeClock(iso)` fixes `Date.now()` and `new Date()`, keeps timers real, refuses an invalid instant
  with a `RangeError`, restores the real clock when the test finishes, and returns a restore for `beforeAll` use.
- **FR-004**: `freezeIds()` makes ids deterministic by seeding `crypto.getRandomValues`, imports no id source,
  restores when the test finishes and returns a restore.
- **FR-005**: `Fake.of(AbstractClass)` returns a class of the port whose unimplemented methods are spies, whose
  subclass may add statics and implemented methods, with typed `record(name, value)` and `calls(name)`; `Fake` alone
  records calls for a double with no port.
- **FR-006**: `createMatcher(name, fn)` registers a typed `expect` matcher (sync or async, with arguments) and returns
  it named; augmenting `Matchers<R>` of `@stackra/testing` types `expect(x).toY()`.
- **FR-007**: `factory<T>(defaults)` builds plain test data: values or index generators per field, overrides that
  skip the overridden generator, `build()` at index 0, `buildMany(n)` at `0..n-1`, and a `RangeError` for a bad count.
- **FR-008**: `.` has no workspace dependency and no domain type (ADR 0269 decision 2).

## Template contract

The template imports exactly `Fake, afterEach, beforeAll, beforeEach, createMatcher, describe, expect, factory,
freezeClock, freezeIds, it, vi` from `@stackra/testing`, and augments `interface Matchers<R>` there. Each one exists
with the shape the template uses: `class XFake extends Fake.of(Port)` with `this.record(...)` and `calls(...)`,
`createMatcher("toY", async (received, ...args) => ({ pass, message }))`, `factory<T>({ field: value | (i) => value })`
with `.build(overrides)`, `freezeClock(isoString)` in a test or hook, and `freezeIds()` in `beforeAll`.

## Success Criteria

- **SC-001**: every symbol the template imports from `@stackra/testing` exists with the shape it uses.
- **SC-002**: every public symbol has a test in `src/**/__tests__/`, run later by the testing workflow.
- **SC-003**: `package.json` lists no `workspace:` runtime or peer dependency.

## Edge cases

- **EC-01**: `freezeClock` or `freezeIds` in `beforeAll`: no current test, so nothing auto-restores; the state holds
  for the file and the returned function ends it.
- **EC-02**: a fake is awaited, serialised or printed: `then`, `toJSON` and other probed names are never spied.
- **EC-03**: an overridden fixture field whose default is a generator: the generator is not called.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · retroactive spec for a package already written (owner mode 2026-10-24: develop now, test later)
