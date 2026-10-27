<!-- Purpose: the rules an agent follows when changing @stackra/support. Boundary: packages/foundation/support only. Runtime: docs. Governing contract: ADR 0294, ADR 0305; STA-934. -->

# AGENTS — @stackra/support

Dependency-free pure helpers, grown on demand. Member at `packages/foundation/support` (`tier:lib`), in the
programming model v3.1 shape (ADR 0294, 0305).

## Rules

- One entry, `.`, backed by `src/core/`. No `./contracts`, `./node` or other entry: support has no ports, no module
  and no renderers.
- Zero `dependencies`, zero `peerDependencies`, no workspace import. Dev dependencies come from catalogs or
  `workspace:*` only.
- No host globals: no `process`, `window`, `Date.now()`, `new Date()` without an argument, `Math.random()` or host
  locale and time zone reads. The caller passes the time in. Web Crypto is the one platform API used: `crypto.subtle`
  by `canonicalHash`, `signedToken` and `oneTimeCode`, `crypto.getRandomValues` by `oneTimeCode` only.
- Keys are the caller's: `signedToken` and `oneTimeCode` take a `SigningKeySource`, a structural type the
  `KeyProvider` of @stackra/contracts satisfies. Never import contracts for it (support stays dependency-free and
  contracts may import support). Never store, log or return a one-time code's plaintext; verify only through
  `crypto.subtle.verify` (constant time). Lengths, lifetimes and attempts are the caller's settings, never defaults.
- Money never passes through a float: `Quantity.priceMinor` takes and returns whole minor units; rounding steps and
  modes are caller values.
- `canonicalJson` is frozen: every audit chain and signed checkpoint hashes its output (ADR 0416). Never change it.
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

| Data | Where | Handling                                                                                                                        |
| ---- | ----- | ------------------------------------------------------------------------------------------------------------------------------- |
| None | —     | This package handles no personal data. `signedToken` data is signed, not encrypted: callers put ids in it, never personal data. |
