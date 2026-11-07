---
"@stackra/workflow": patch
---

Migration `workflow.0009_rename_checklist_progress` renames `workflow.checklist_progress` to
`workflow.checklist_progresses`, the table the `ChecklistProgress` model maps to, so the checklist service's progress
reads and writes reach a real table. Rows, indexes and the scope policy move with it. A new integration test runs the
checklist service on Postgres with every workflow migration applied.
