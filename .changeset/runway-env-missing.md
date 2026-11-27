---
"@stackra/runway": minor
---

`runway env missing <env> [--dir <dir>]` checks, before anything is decrypted or deployed, that the environment's sops
scope holds every secret its deploy syncs (STA-258): a required name the scope lacks fails the run, read from the
ciphertext file names only. A name only code declares, `required: false` everywhere, is a placeholder: the check warns,
`deployPlan` marks it `optional`, `secretSyncPlan` lists it in the entry's new `placeholders`, `readMemberSecrets` reads
it as an empty string when the scope lacks it, and `runway secrets sync` writes it into Encore empty, so the service
still provisions. The secrets-decrypt action runs the check when its new `check-environment` input is set.
