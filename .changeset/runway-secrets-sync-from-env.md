---
"@stackra/runway": minor
---

`runway secrets sync <env> --from-env` reads each member's declared values from the job's environment, where `.github/actions/secrets-decrypt` put the product's sops scope (ADR 0525), instead of Infisical. A missing name fails before anything is written, and the error names the scope to decrypt. Everything else stays as it was: it writes only in a proved CI job, prints names only and writes each name to Encore once.
