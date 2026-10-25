# Plan: extend experience, builder, panel, ui, ui-pro, ai, registry and runway

**Spec**: `.agents/specs/sta-348-ext-experience-ai/spec.md`

## Design

- **ai** (`src/core`): `resolveApproval(request, { floor, policy, preferences })` walks IAM, entitlement,
  environment, floor, organisation, user, level. A floor hit or L3/L4 is a named approver that only escalation
  reroutes. `routeModel(request, table)` filters rows by task and data class, prefers in-region, then the region
  rule's fallback (opt-ins honoured, disclosed). `resolveModel` hands the choice to a bound `ModelProviderDriver`.
  `allowFields`, `redact`, `checkBudget`, `runGuardrails`, `runEvals`, `routeIntent` (phrase match, else `decide`).
- **registry** (`src/core`): shape classes `AppReview`, `DeveloperSandbox`, `FeeSchedule`, `PartnerPayout`,
  `EditionBundle` with shipped schemas; `canTransitionReview`, `computePartnerPayout` (BigInt, half up),
  `planEditionInstall` (Kahn order, code-unit ties).
- **panel** (`src/core`): `SavedView` shape with `SavedView$`; `ViewStore` port; `groupRows`; `essential` on form
  fields with `visibleFields(fields, DisplayMode)`; `Place.LineEntry`, `lineEditorOf`, `activeContributions`.
- **ui**: contracts `DisplayMode`, `AiMarkKind` and three props contracts; web and native components composed from
  `Alert`, `Icon`, `Text` and `Switch`; `sparkles` registered; `./testing` exports `FakeConfirmationProvider`.
- **ui-pro** (`./react`): compositions on `ChatTool`, `Timeline` and `@stackra/ui`; scheduler and signature math in
  `src/core/functions` (internal).
- **experience**: `ExperienceKind` in `./contracts`; `Block({ kinds })`; `validateDocument` returns problems;
  append-only theme revisions.
- **builder**: `EditorOptions.kind` and `.kit`; `Editor.allows`, `Editor.palette`; `BlockNotAllowedError`.
- **runway**: `regions` and `providers.gcp` in the root schema (zod and `schema/root.json`), environment `regions`;
  `RunwayCloud`, `checkRegions`, `regionsOf`.

## Constitution Check

| Law                     | Result | Note                                                                                     |
| ----------------------- | ------ | ---------------------------------------------------------------------------------------- |
| Boundaries              | PASS   | each package imports only its existing dependencies; panel reads `@stackra/ui/contracts` |
| Configuration, not code | PASS   | floors, routes, regions, rates, hours, week and kits are inputs; only mechanism in code  |
| Secrets                 | PASS   | none read; drivers resolve their own credentials                                         |
| Test placement          | PASS   | tests in `__tests__/` beside each subject                                                |
| Versions                | PASS   | no new dependency                                                                        |
| Owner mode              | PASS   | nothing run: no tests, typecheck, build or deploy                                        |
