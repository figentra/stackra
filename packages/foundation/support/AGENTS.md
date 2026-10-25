# AGENTS — @stackra/support

Dependency-free pure helpers, grown on demand. Member at `packages/foundation/support` (`tier:lib`), in the
programming model v3.1 shape (ADR 0294, 0305).

## Rules

- One entry, `.`, backed by `src/core/`. No `./contracts`, `./node` or other entry: support has no ports, no module
  and no renderers.
- Zero `dependencies`, zero `peerDependencies`, no workspace import. Dev dependencies come from catalogs or
  `workspace:*` only.
- No host globals: no `process`, `window`, `Date.now()`, `new Date()` without an argument, `Math.random()` or host
  locale and time zone reads. The caller passes the time in.
- A helper is added when a package or service imports it, never ahead of a consumer. Port `str`, `arr`, `async` and
  `object` from the Figentra OS source only then.
- One declaration per file (ADR 0305); a file opens with the Stackra file contract and every export carries TSDoc.
- `src/core/index.ts` is a stand-in barrel until gen writes it (STA-339): add each public file to it and to the export
  list in `src/core/__tests__/index.test.ts`.
- No `Enum.of` (it is `@stackra/contracts'`): unit codes are a frozen table (`QUANTITY_UNITS`) and a derived type.
- Exact means exact: `Quantity` keeps big-integer fractions and never takes a fractional `number`. A unit's factor is
  its legal definition; which unit a Market uses is market-pack data, never here.
- GTIN validation is `@stackra/validation`'s (conflict #1); this package keeps restricted-range allocation and Code 128.
- Tests sit in `__tests__/` beside the subject and import the runner from `@stackra/testing` (ADR 0269).

## PII

| Data | Where | Handling                               |
| ---- | ----- | -------------------------------------- |
| None | —     | This package handles no personal data. |
