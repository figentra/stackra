# Implementation Plan: `@stackra/testing`, the generic test kit (`.` entry)

**Spec**: `.agents/specs/sta-348-testing/spec.md` · **Linear**: STA-348 · **Date**: 2026-10-24

## Summary

A new `tier:lib` member at `packages/developer/testing` with one entry, `.`, backed by `src/core/`. The stand-in
barrel re-exports vitest (a peer dependency) and the kit: `freezeClock` (vitest fake timers, `Date` only),
`freezeIds` (a seeded `crypto.getRandomValues` spy), `Fake` with `Fake.of(Port)` (a subclass of the port whose
constructor returns a proxy that creates a named `vi.fn()` spy for a missing lowerCamel method), `createMatcher`
(`expect.extend` plus a named return) with the augmentable `Matchers<R>` merged into vitest's `Matchers`, and
`factory<T>()`. Restoration after a test goes through one internal helper on `onTestFinished`.

## Technical Context

- **Language**: TypeScript, ESM, `@stackra/typescript-config/library`
- **Members**: `packages/developer/testing` only
- **Testing**: vitest through the package's own `.` entry, in `src/**/__tests__/` (not run in this phase)
- **Storage**: none

## Constitution Check

| Law                                   | Result | Note                                                               |
| ------------------------------------- | ------ | ------------------------------------------------------------------ |
| Boundaries (tier direction, ADR 0003) | PASS   | no workspace runtime edge; dev edges only to the tooling presets   |
| Secrets (ADR 0173)                    | N/A    | no secret                                                          |
| Security                              | N/A    | test-only code                                                     |
| HTTP and events                       | N/A    | no action, endpoint or event                                       |
| Tenancy                               | N/A    | no tenant data                                                     |
| Not built yet (ADR 0227)              | PASS   | vitest only; no Jest                                               |
| Test placement (ADR 0022)             | PASS   | every test in `__tests__/` beside its subject                      |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only; `vitest` from `catalog:quality` |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                 |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; no ADR needed            |

## Properties

- **P-001**: the vitest names exported by `.` are identical (`===`) to vitest's — Validates: FR-001
- **P-002**: after a test that froze the clock or ids, the next test sees the real ones — Validates: FR-003, FR-004
- **P-003**: a `Fake.of` instance is `instanceof` its port and is not thenable — Validates: FR-005
- **P-004**: a test in this package calls `vi.mock` after importing `vi` from `@stackra/testing`, and the mock still applies to the imports above it, because `vi.mock` hoists — Validates: FR-002
- **P-005**: `createMatcher("toY", fn)` registers a matcher that `expect(x).toY(...)` calls, sync or async and with arguments, returns the name, and an augmentation of `Matchers<R>` types the call — Validates: FR-006
- **P-006**: `factory<T>(defaults).build()` builds index 0 and `buildMany(n)` builds `0..n-1`, an override replaces its field without calling that field's generator, and a bad count throws a `RangeError` — Validates: FR-007
- **P-007**: `package.json` lists no `workspace:` runtime or peer dependency, and `.` exports no domain type — Validates: FR-008

## Decisions

- `Fake` lives in `src/core/fake.fake.ts`: it is the kind base of `.fake.ts` files (ADR 0305 rule 3), and no group of
  ADR 0294 decision 15 names a home for a kind base; the placement check (STA-338) may move it.
- vitest is a peer dependency so the consumer's instance is the one re-exported and extended.
- The vitest re-exports sit in the stand-in barrel; gen must keep them when it writes the entry barrel (STA-339).

## Deploy modes

| Mode       | Behaviour                                                        |
| ---------- | ---------------------------------------------------------------- |
| SaaS       | a build-time library, bundled into the consumer's app or service |
| On-prem    | identical: the same build, no SaaS-only code path                |
| Air-gapped | identical: needs no network at build or run                      |
