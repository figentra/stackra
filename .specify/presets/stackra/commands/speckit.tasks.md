---
description: Generate tasks; each maps to a Linear issue.
strategy: wrap
---

## Stackra: feature directory (runs first)

Specs live in `.agents/specs/sta-<n>-<slug>/` (ADR 0120 D1), never in `specs/`. Before anything else run
`node tools/scripts/spec-gate.mjs dir` (add `--key STA-n` when the branch name carries no key). It prints the
spec folder for the branch's Linear key and writes `.specify/feature.json`. Pass that path as
`SPECIFY_FEATURE_DIRECTORY=<path>` in front of every `.specify/scripts` call this command makes. If it fails,
STOP and report it; never fall back to a numbered folder.

{CORE_TEMPLATE}

## Stackra: Linear mapping

Every task line keeps its `T###` id. After writing `tasks.md`, tell the user to run
`node tools/scripts/spec-linear.mjs tasks <tasks.md> --dry-run` and then without `--dry-run`
(or ask the agent to use the Linear MCP). The script appends ` [STA-n]` to each task line it creates
an issue for; tasks are sub-issues of the spec's `**Linear**` issue.
