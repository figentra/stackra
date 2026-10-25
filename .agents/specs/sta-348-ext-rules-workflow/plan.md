# Plan: extend `@stackra/rules` and `@stackra/workflow`

**Spec**: `.agents/specs/sta-348-ext-rules-workflow/spec.md`

## Design

- Rules: outcome kinds are registered beside fact sources and checked with the same field rules (`fitsOperand`).
  A revision stores `{ condition, outcomes?, seed? }`; `decide` = `evaluate` + `checkOutcomes` + `guardFloors`.
  `guardFloors` reads `ResolvedValue` floors from `@stackra/market-packs` and lifts number parameters across a
  `min`/`max` bound, reporting law, market and version. The dispatcher routes, the consumer applies.
- Workflow: coded workflows and automation documents compile to one `WorkflowPlan` (ADR 0152 decision 5). A document
  run is keyed `workflow.document` and keeps its checked document in its input (its version pin); its steps call
  action blocks through `ActionPipeline` as the run's principal with the step key as the Idempotency-Key. Conditions
  are `@stackra/rules` conditions over the trigger block's facts. Event waits reuse the held-signal journal: the
  explorer holds each occurrence of a correlating trigger block. Coded runs resume on `WORKFLOW_KEYS.versions`.
- Seeds (both packages): a seeded row records its template key and seed version; a new version is published only
  while the latest revision carries the seed marker.

## Constitution Check

| Law                                | Result | Note                                                                      |
| ---------------------------------- | ------ | ------------------------------------------------------------------------- |
| Boundaries (ADR 0003)              | PASS   | rules adds `@stackra/market-packs`; workflow adds rules, content, model   |
| Tenancy                            | PASS   | `workflow.automations` under forced RLS on `scope_path`                   |
| Configuration over code (ADR 0363) | PASS   | floors and defaults are data; code holds the guard and the seed mechanism |
| Not built yet (ADR 0227, 0154)     | PASS   | documents reference registered code only; no expression language          |
| Test placement (ADR 0022)          | PASS   | every test in `src/**/__tests__/`                                         |
| Versions and catalogs              | PASS   | `workspace:*` only                                                        |
