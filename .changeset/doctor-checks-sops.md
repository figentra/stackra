---
"@stackra/cli": patch
"@stackra/infra-testbed": patch
---

`stackra doctor` no longer checks for the Infisical CLI and login (ADR 0525). A workspace whose root scripts run
`secrets-exec.mjs` is checked for the sops CLI, the Google Application Default Credentials file sops decrypts with
(its presence only; the credential is never read) and a `figentra/secrets` clone with an `agents` folder. The
`infisical` doctor need and the `DoctorWorkspace.infisical` field are gone. The testbed's toolchain test no longer
expects the Infisical CLI in `mise.toml`; the boxes keep their own pin until they read sops.
