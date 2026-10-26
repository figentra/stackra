---
"@stackra/rules": minor
---

Add `FIELD_KEY` in `./contracts`, the one camelCase key casing `Rules.create` and `FactSource$` use. `./node` gains the
`ConditionField` model (`rules.condition_fields`, migration 0003) and `ConditionFieldService` (sync from `FactSource$`
documents, `rulesOf`, `check`). `ACTION_PERMISSION_RULES`, `actionPermissionRowsOf` and `RuleSetService.approvalMatrix`
read the `ai.action_permissions` rule set into `ActionPermissionRow[]`; `packApprovalFloorOf` reads the
`ai.approval_floor` pack value. `OutcomeParam.optional` and `RulesOptions.maxOutcomes` (1 to 500) for matrix rows, with
lang keys in seven locales.
