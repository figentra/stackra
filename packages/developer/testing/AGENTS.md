# AGENTS — @stackra/testing

The generic test kit. Member at `packages/developer/testing` (`tier:lib`), in the programming model v3.1 shape
(ADR 0294, 0305), placed by ADR 0127 and shaped by ADR 0269.

## Rules

- One entry today, `.`, backed by `src/core/`. `./react`, `./native`, `./e2e` and `./contract` (ADR 0269 decision 6)
  are added with navigation and app, each when it holds real code.
- `.` is generic (ADR 0269 decision 2): its only runtime edge is the `vitest` peer. No workspace import, no domain
  type, nothing that knows a module, action, permission or event. `src/__tests__/package-boundary.test.ts` checks it.
- Domain helpers never come here: they go in the owning package's `./testing` entry (ADR 0269 decision 3).
- Re-export vitest's objects; never wrap or copy them, so `expect.extend` and `vi` act on the consumer's instance.
- `src/__tests__/mock-hoisting.test.ts` is the gate of ADR 0269 decision 4. If it fails, stop and go to the owner;
  never fall back to global `vi`.
- One declaration per file (ADR 0305); a file opens with the Stackra file contract and every export carries TSDoc.
- Tests sit in `__tests__/` beside the subject and import the runner from `@stackra/testing`.

## PII

| Data | Where | Handling                               |
| ---- | ----- | -------------------------------------- |
| None | —     | This package handles no personal data. |
