# Tasks: extend `@stackra/rules` and `@stackra/workflow`

- [x] rules: `OutcomeKind`, `OutcomeParam`, `SeedResult` (contracts)
- [x] rules: `Rules` outcome kinds, `outcomeProblems`, `checkOutcomes`, `OutcomeInvalidError`
- [x] rules: `guardFloors`, `decide`, `OutcomeDispatcher`
- [x] rules: `RuleSetPack$`; `RuleSetService.draft` outcomes, `decide`, `seed`, `seedPack`; migration `0002`
- [x] workflow: version pin (options, plan, run, registry, Postgres journal, migration `0002`)
- [x] workflow: event waits (`waitFor` event, `hold` of events, explorer holding and boot check)
- [x] workflow: building-block registry
- [x] workflow: `AutomationDocument$`, `checkAutomation`, `dryRun`, `documentPlan`, `startDocument`
- [x] workflow: `Automation`, `AutomationService`, migration `0003`, explorer automation starters
- [x] workflow: `WorkflowTemplatePack$`, seeding
- [x] tests, README, AGENTS, changesets
- [ ] owner: run `pnpm install` and `pnpm verify` (not run in owner mode)
