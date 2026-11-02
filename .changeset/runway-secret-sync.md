---
"@stackra/runway": minor
---

`runway secrets sync <env> [--dry-run]` syncs each service's declared secrets from Infisical into its Encore Cloud
environment with `encore secret set`, the value on stdin (STA-606). The sync prints names only, reads every value
before it writes anything, refuses one Encore name with two values, and reads values only in a CI job; `--dry-run`
reads nothing. `readMemberSecrets` (exported from `./node`, with `readRunways`, `secretSyncPlan`, `syncSecrets` and
the `DeployRunways` and `SecretSyncEntry` types) returns one member's values in memory only, for the Workers provider's
versions upload (STA-1990). A Worker's secrets stay with the Workers provider; EAS waits for STA-2009.
