---
"@stackra/cli": minor
---

`stackra deploy --env <environment> [--kind <k,…>] [--member <key,…>] [--sha <sha>] [--dry-run]`, without
`--product`, ships a commit (`HEAD` by default) to every target of the environment in the root `runway.yaml`, through
runway's `deploy()` with the `encore-cloud`, `eas`, `mintlify` and `cloudflare-workers` providers (STA-1921). A dry run
prints each target's plan. `--product` keeps the product deploy.
