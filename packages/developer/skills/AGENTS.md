# AGENTS — @stackra/skills

The agent-neutral source of Stackra's open conventions (ADR 0282, 0286). Member at `packages/developer/skills`
(`tier:lib`). Entries `.` and `./node`, plus the shipped documents under `assets/` (ADR 0127, 2026-10-24 note).

## Where things go

| You are writing…                        | It goes in…                                           |
| --------------------------------------- | ----------------------------------------------------- |
| A skill (open convention)               | `assets/skills/<name>/SKILL.md`                       |
| A rule (open convention)                | `assets/rules/<name>.md`                              |
| A frontmatter schema change (internal)  | `src/core/constants/front-matter-schemas.constant.ts` |
| An enum                                 | `src/core/enums/<name>.enum.ts` (`Enum.of`)           |
| An isomorphic function (no Node import) | `src/core/functions/<name>.function.ts`               |
| A Node-only function (reads files)      | `src/node/functions/<name>.function.ts`               |
| A test                                  | `__tests__/<name>.<kind>.test.ts` beside it           |

## Rules

- Layer 1 only: structure, naming, decorators and boundaries. Generators, reviewer checklists, orchestration and fix
  playbooks are layer 2 and never land here (ADR 0282 decision 7).
- No Figentra-internal operation (Linear, bot identities, merge gate, secrets inbox, delegation, spend); the loader
  test fails on them.
- `.` stays bundle-safe: no `node:*` import outside `src/node/`.

## PII

None. Skills and rules are framework documentation; they hold no personal data and the loader stores nothing.
