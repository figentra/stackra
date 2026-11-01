---
"@stackra/repo-checks": minor
---

Add the read-only spec checks (STA-1669) as published code: `specFindings` runs the stage gate of every changed
`.agents/specs/<prefix>-<n>-<slug>/` folder, the foreign-status, bug-lane and lane gates and the trace rules over injected
git and file access, with the building blocks `specCheckStage`, `specCheckClarified`, `specCheckPlan`, `specCheckTasks`,
`specCheckLane`, `specCheckForeignStatus`, `specCheckBug`, `specTrace`, `specTraceProblems`, `specDrift` and the parsers.
The issue prefix is read from the repository's own spec folder names (`os-12-billing` is key `OS-12`), not fixed to one team.
