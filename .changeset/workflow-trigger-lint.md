---
"@stackra/repo-checks": minor
---

`stackra validate --repository` refuses a paid job (a macOS, Windows or larger runner, `eas build`, a device farm run) on a branch push or pull request trigger, and a deploy credential in the env of a job with no `environment:` (rule `workflow-triggers`, `checkWorkflowTriggers`; STA-256, ADR 0166, 0167).
