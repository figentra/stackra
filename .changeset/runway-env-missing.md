---
"@stackra/runway": minor
---

`runway env missing <env> [--dir <dir>]` checks, before anything is decrypted or deployed, that the environment's sops
scope holds every secret its deploy syncs (STA-258): a required name the scope lacks fails the run, read from the
ciphertext file names only. A name only code declares, `required: false` everywhere, is a placeholder: the check warns,
`deployPlan` marks it `optional`, `secretSyncPlan` lists it in the entry's new `placeholders`, `readMemberSecrets` reads
it as an empty string when the scope lacks it, and `runway secrets sync` writes it into Encore empty, so the service
still provisions, only when `encore secret list` shows Encore holds no value for it in that environment: a value set by
hand is kept, and when the listing cannot be read no placeholder is written. `runway secrets decrypt` runs the same check
first for a product scope (`products/<project>/<env>`) of the checked-out repository and exits 1, naming the missing
secrets, before it decrypts anything, so every deploy that reads its secrets through the secrets-decrypt action is
checked with no input to set. An optional config name (a `config` row with `required: false`, whose class has a
default) is never a placeholder, since an empty value would override that default: `deployPlan` marks it
`optional: "default"` (an optional secret is `optional: "placeholder"`), `secretSyncPlan` lists it in the entry's
`defaults`, `readMemberSecrets` leaves it out when the scope lacks it or holds it empty, and the sync leaves it unset in
Encore and says so.
