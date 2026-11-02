---
"@stackra/runway": minor
"@stackra/cli": minor
---

`stackra deploy --env <environment>` now refuses an environment whose root `runway.yaml` declares
`deploy.approval` unless `--approved` is passed (as `stackra deploy --product` already does), so it ships only from
the CI job behind the owner's approval (ADR 0468). A dry run still plans without it. It also runs Runway's `deploy()`
inside `withDeployLock`, so two deploys of one environment never overlap on one host; the new `fileDeployLock(directory)`
in `@stackra/runway/node` is that lock (a lease file renewed while the work runs; an ended lease is taken over). Across
CI runners the caller workflow's `concurrency` group stays the lock (STA-1969).
