# Tasks: the session alone for React, with no `@stackra/ui`

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Linear**: STA-2832

- [x] T001 the `./react/session` stand-in barrel, its export and its build entry in `packages/security/identity/src/react/session/index.ts`, `packages/security/identity/package.json`, `packages/security/identity/tsdown.config.ts` — covers: AC-001, AC-003, P-001 — route: spec-task
- [x] T002 the entry's test (values, types, external imports) in `packages/security/identity/src/react/session/__tests__/index.test.ts` — covers: AC-001, AC-002, P-001, P-002 — route: spec-task — deps: T001
- [x] T003 the docs and the changeset in `packages/security/identity/AGENTS.md`, `packages/security/identity/src/react/index.ts`, `.changeset/identity-react-session-entry.md` — covers: AC-001 — route: spec-task — deps: T002
