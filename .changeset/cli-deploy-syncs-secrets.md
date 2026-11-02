---
"@stackra/cli": minor
---

`stackra deploy --env <env>` syncs the services' secrets from Infisical into Encore before it ships, when the root
runway says `secrets.sync: on-deploy` and the deploy includes services (STA-606). The sync runs inside the deploy lock,
before the product publish and `deploy()`, so a missing secret ships nothing; `--dry-run` prints the sync's names and
writers with the plan.
