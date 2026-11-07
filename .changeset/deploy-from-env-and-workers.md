---
"@stackra/cli": patch
---

`stackra deploy` takes `--from-env`: the secret sync it runs before services ship reads the job's environment (a
decrypted sops scope, ADR 0525) instead of Infisical. And `--member` now always ships the named Worker members
through the Workers provider: in a repository whose root runway has `surfaces` (core), a Worker deploy no longer runs
the product publish or asks for `--assets-bucket`, `--assets-origin`, `--kv-namespace` and `--served`.
