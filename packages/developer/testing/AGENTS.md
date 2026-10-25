# AGENTS — @stackra/testing

The generic test kit. Member at `packages/developer/testing` (`tier:lib`), in the programming model v3.1 shape
(ADR 0294, 0305), placed by ADR 0127 and shaped by ADR 0269.

## Rules

- Entries `.` (`src/core/`), `./react` (`src/react/`) and `./native` (`src/native/`). `./e2e` and `./contract`
  (ADR 0269 decision 6) are added with app, each when it holds real code.
- `.` is generic (ADR 0269 decision 2): its only runtime edge is the `vitest` peer. No workspace import, no domain
  type, nothing that knows a module, action, permission or event. `src/__tests__/package-boundary.test.ts` checks it.
- `./react` and `./native` import no `@stackra/*` package either: every package's tests depend on this one, so an edge
  back is a cycle in the turbo graph. Their third-party edges (Testing Library, React, React Native) are optional
  peers. They import `.` internals one way and never each other, so the small wrapper helper is kept in each.
- No house provider here: the renders take `providers` and `wrapper`, and framework packages compose theirs. Route
  helpers live in `@stackra/navigation/testing`.
- Domain helpers never come here: they go in the owning package's `./testing` entry (ADR 0269 decision 3).
- Re-export vitest's objects except `vi`; never wrap or copy them, so `expect.extend` acts on the consumer's instance.
  `vi` is imported from `vitest` directly: vitest hoists `vi.mock` only for that import (ADR 0269 decision 4, note of
  2026-10-24), and a re-export would offer an un-hoisted path.
- `src/__tests__/mock-hoisting.test.ts` is the gate of ADR 0269 decision 4. If it fails, stop and go to the owner;
  never fall back to global `vi`.
- One declaration per file (ADR 0305); a file opens with the Stackra file contract and every export carries TSDoc.
- Tests sit in `__tests__/` beside the subject and import the runner from `@stackra/testing`.

## PII

| Data | Where | Handling                               |
| ---- | ----- | -------------------------------------- |
| None | —     | This package handles no personal data. |
