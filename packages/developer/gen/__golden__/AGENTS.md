# AGENTS — gen golden snapshots

<!--
Stackra file contract:
Purpose: the agent rules for the golden fixtures of @stackra/gen.
Boundary: packages/developer/gen/__golden__ only; README.md beside this file has the layout and the command.
Runtime: none
Governing contract: STA-1320; ADR 0294 (decisions 10 and 22); ADR 0295 (decision 5).
-->

- Never hand-edit `expected/` or `refusals.json.golden`. Refresh them only with
  `UPDATE_GOLDEN=1 pnpm --filter @stackra/gen exec vitest run src/node/__tests__/golden.test.ts` on ci-box, and
  review the diff: a changed path, file set or refusal code is a change to gen's frozen interface (STA-1320).
- Every file here ends in `.golden`; `input/_modules/` becomes `node_modules/`. Keep both conventions, or tsc, oxlint
  and git start reading fixture data.
- A new fixture is a folder with `input/` plus a row in `FIXTURES` in `src/node/__tests__/golden.test.ts` and in the
  README table; a refusal fixture overlays its `base` fixture's input with only the files that cause the refusal.
- Fixture workspaces carry their own `pnpm-workspace.yaml` and `runway.yaml`, so gen never reads the core repository
  root from a fixture.
