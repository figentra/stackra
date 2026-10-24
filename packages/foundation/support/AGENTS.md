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
- Tests sit in `__tests__/` beside the subject and import the runner from `@stackra/testing` (ADR 0269).

## PII

| Data | Where | Handling                               |
| ---- | ----- | -------------------------------------- |
| None | —     | This package handles no personal data. |
