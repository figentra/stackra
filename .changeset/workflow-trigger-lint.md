---
"@stackra/repo-checks": minor
---

`stackra validate --repository` refuses a paid job (a macOS, Windows or larger runner, also through `strategy.matrix`; `eas build`; a device farm run) on a branch push, pull request or merge queue trigger, and, in a job with no `environment:`, a deploy credential in its env or a deploy variable or secret read in a step's env, `with:` or `run:` (rule `workflow-triggers`, `checkWorkflowTriggers`; STA-256, ADR 0166, 0167).
