---
"@stackra/rules": minor
"@stackra/iam": patch
"@stackra/segments": patch
"@stackra/achievements": patch
"@stackra/workflow": patch
---

Breaking renames for unique public names (STA-1383): `@stackra/rules` `Decision` is `RuleDecision` (iam's `Decision`
is the allow or deny enum) and `Facts` is `RuleFacts` (ai's `Facts` is the facts kind base). Importers are updated.
