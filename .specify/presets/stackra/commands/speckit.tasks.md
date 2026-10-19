---
description: Generate tasks; each maps to a Linear issue.
strategy: wrap
---

{CORE_TEMPLATE}

## Stackra: Linear mapping

Every task line keeps its `T###` id. After writing `tasks.md`, tell the user to run
`node tools/scripts/spec-linear.mjs tasks <tasks.md> --dry-run` and then without `--dry-run`
(or ask the agent to use the Linear MCP). The script appends ` [STA-n]` to each task line it creates
an issue for; tasks are sub-issues of the spec's `**Linear**` issue.
