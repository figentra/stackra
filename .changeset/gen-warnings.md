---
"@stackra/gen": minor
"@stackra/cli": patch
---

Gen has warnings: a `GenError` with `severity: "warning"` prints as `<at> warning <code> ...` with its fix, never stops
gen writing, and comes back in `warnings` from `generateMember` and `generate`; `stackra gen` and `stackra gen --check`
print it and exit 0, while an error still exits 1. ADR 0101's checks run in the full pass as the new exported
`checkActionFirst`: `action_without_workflow` warns an action that takes another service's client, a sibling module's
service or `ConnectionStore` and starts no workflow, and `workflow_without_action` refuses a controller, command or
listener that takes a workflow or `WorkflowRunner`, or starts a workflow itself. The source reader records the
workflows a class starts as `DeclaredClass.workflows` (STA-340).
