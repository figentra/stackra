# AGENTS — @stackra/repo-checks

<!--
Stackra file contract:
Purpose: the agent rules of @stackra/repo-checks: where a check goes and the rules that keep checks portable.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0282 (decision 3); ADR 0294; ADR 0305 (one declaration per file).
-->

The repository checks `stackra check` runs (ADR 0282 decision 3). Member at `packages/developer/repo-checks`
(`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305).

## Where code goes

| You are writing…                       | It goes in…                                                       |
| -------------------------------------- | ----------------------------------------------------------------- |
| A check (text in, finding strings out) | `src/node/functions/check-<name>.function.ts`, pure               |
| A phase runner (reads the repository)  | `src/node/functions/<phase>-findings.function.ts`                 |
| A table the checks read                | `src/node/constants/<name>.constant.ts`                           |
| A type                                 | `src/node/types/<name>.type.ts`                                   |
| A test                                 | `__tests__/<subject>.test.ts` beside it                           |
| The export                             | a line in the stand-in barrel `src/node/index.ts` (until STA-339) |

## Rules

- A check is pure: it takes paths and texts and returns finding strings (`path: message` or `path:line: message`,
  ending with the ADR in parentheses where one governs). Only the runners read the disk or run git and pnpm.
- A missing or broken git never crashes a phase: `readRepoContext` falls back to `walkRepoFiles` (a walk honouring
  `.gitignore`).
- A check that changes behaviour changes its test in the same commit; the cases moved from `tools/scripts` stay.
- Erasable TypeScript only (no enums, namespaces or parameter properties): core's wrappers in `tools/scripts` load
  this source with plain `node` (type stripping plus a `#` resolve hook in `tools/scripts/repo-checks.mjs`). Every
  type-only import is `import type`.
- No test source holds an import string the `imports` check would flag; build such strings with a quote variable.
- One declaration per file (ADR 0305); a file opens with the Stackra file contract and every export carries TSDoc.

## PII

| Data | Where | Handling                               |
| ---- | ----- | -------------------------------------- |
| None | —     | This package handles no personal data. |
