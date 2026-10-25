# Spec: extend `@stackra/rules` and `@stackra/workflow`

**Source**: `notes/handover/stackra-package-needs.md` rows `@stackra/rules`, `@stackra/workflow` and "Rule-set and
template packs"; `config-model.md` sections 4 to 6; ADR 0331, 0122, 0153, 0152, 0245 (decision 8), 0270 (decision 6).

## `@stackra/rules`

| Need                                           | Delivered                                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Outcome-kind registration                      | `OutcomeKind`, `OutcomeParam` (contracts); `RulesOptions.outcomes`; `Rules.checkOutcomes`  |
| Outcome dispatcher per consumer                | `OutcomeDispatcher.create(rules, handlers)`; one handler per kind, checked at load         |
| Rule-set packs as versioned documents          | `RuleSetPack$`; `RuleSetService.seed` / `seedPack`; migration `0002` (`seed_key`, version) |
| Market-pack floor as final guard every outcome | `guardFloors`, `decide` (floors required), `RuleSetService.decide`; `Decision.floored`     |

## `@stackra/workflow`

| Need                         | Delivered                                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| Building-block registry      | `registerBlocks`, `buildingBlocks`, `BlockKind`, `BuildingBlock` (trigger facts and correlation)    |
| Automation document kind     | `AutomationDocument$`, `checkAutomation`, `Automation` model, `AutomationService`, migration `0003` |
| Dry run                      | `dryRun`; `AutomationService.dryRun` records it; `publish` refuses without it                       |
| Version pin                  | `Workflow({ version })`, `WorkflowRun.version`, `WORKFLOW_KEYS.versions`, migration `0002`          |
| Event waits                  | `@Step({ waitFor: Event })`; explorer holds correlating trigger occurrences                         |
| Workflow template packs      | `WorkflowTemplatePack$`, `AutomationService.seed` / `seedPack`                                      |
| Plans as ephemeral workflows | `NativeWorkflowRunnerDriver.startDocument` (a document without a trigger, no stored record)         |

## Acceptance

- No country, rate, price or policy in code; floors are market-pack data; defaults are seed documents.
- A seed never overwrites a tenant's edit.
- Every outcome passes the floor guard; every document step is a normal action call as the run's principal.
- Existing public API unchanged (additive); existing tests updated only where an export list or a stored shape grew.
