---
"@stackra/workflow": minor
---

Add for-each steps and event-chain limits to automations (OS-232). A document step takes `forEach: { items: <ref> }`
and calls its block once per item (`item` and `item.<path>` references, per-item keys, results in item order); a list
longer than `workflow.forEachLimit` (1,000 by default) fails with `ForEachItemsInvalidError`, and the dry run reports
`iterations`. A document step's call id is now its step key, so events its block records name the run as their
correlation; `NativeWorkflowRunnerDriver.chained` places a triggered run in its event chain (`RunChain`, kept in the
run's input via `startDocument(…, { chain })`), and the explorer starts nothing past `workflow.maxChainDepth` (3 by
default) or back into an automation already in the chain.
