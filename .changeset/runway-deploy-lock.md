---
"@stackra/runway": minor
---

Add `withDeployLock(root, environment, lock, work, ttl?)`, the `DeployLock` type and `RunwayLockedError` (ADR 0435): one
apply per environment at a time (a deploy, promotion, rollback or settings promotion) under the key
`runway:deploy:<project>:<environment>`, held through the caller's `@stackra/locking` `Locks`; a held lock refuses at once.
