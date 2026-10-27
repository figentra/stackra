# AGENTS — @stackra/skills

<!--
Stackra file contract:
Purpose: the agent rules of @stackra/skills: where documents, schemas and the registry item contracts go.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0282; ADR 0286; ADR 0453 (decision 11).
-->

The agent-neutral source of Stackra's open conventions (ADR 0282, 0286). Member at `packages/developer/skills`
(`tier:lib`). Entries `.`, `./contracts` and `./node`, plus the shipped documents under `assets/` (ADR 0127, 2026-10-24 note).

## Where things go

| You are writing…                        | It goes in…                                           |
| --------------------------------------- | ----------------------------------------------------- |
| A skill (open convention)               | `assets/skills/<name>/SKILL.md`                       |
| A rule (open convention)                | `assets/rules/<name>.md`                              |
| A frontmatter schema change (internal)  | `src/core/constants/front-matter-schemas.constant.ts` |
| An enum                                 | `src/core/enums/<name>.enum.ts` (`Enum.of`)           |
| An isomorphic function (no Node import) | `src/core/functions/<name>.function.ts`               |
| A Node-only function (reads files)      | `src/node/functions/<name>.function.ts`               |
| A registry item shape or schema         | `src/contracts/{enums,types,constants}/` (ADR 0453)   |
| A test                                  | `__tests__/<name>.<kind>.test.ts` beside it           |

## Rules

- Layer 1 only: structure, naming, decorators and boundaries. Generators, reviewer checklists, orchestration and fix
  playbooks are layer 2 and never land here (ADR 0282 decision 7).
- No Figentra-internal operation (Linear, bot identities, merge gate, secrets inbox, delegation, spend); the loader
  test fails on them.
- `.` and `./contracts` stay bundle-safe: no `node:*` import outside `src/node/`.
- `./contracts` is the leaf entry the registry Worker and `stackra add`/`publish` share (ADR 0453 decision 11): it
  imports no other entry of this package. A change to `StackraKind` or a schema updates `src/contracts/__tests__` and
  the README in the same commit; a new kind needs an ADR.

## PII

None. Skills and rules are framework documentation; they hold no personal data and the loader stores nothing.
