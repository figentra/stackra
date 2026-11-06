---
"@stackra/runway": minor
---

`runway secrets decrypt --scope <scope> [--dir <dir>] [--names A,B]` (ADR 0525) runs inside a GitHub Actions job. It decrypts one figentra/secrets scope with the job's own Cloud KMS identity, reading the per-secret `<scope>/<NAME>.enc.yaml` ciphertext that `.github/actions/secrets-decrypt` downloaded. It masks every value and exports it into `GITHUB_ENV` for the steps after it. It prints names only, and refuses to run without `GITHUB_ENV`. Together with the shared action (Workload Identity login, a `gcloud storage cp` of the scope, then this command), it replaces every Infisical login step.
