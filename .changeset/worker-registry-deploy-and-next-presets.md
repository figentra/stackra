---
"@figentra/worker-registry": patch
---

CI-only deploy of the registry (stackra-212, owner decision D8): `.github/workflows/deploy-registry.yml` tests and
builds the Worker, substitutes the D1 and KV ids from the `registry` environment's variables, applies the D1
migrations, deploys, sets `REGISTRY_SIGNING_KEY` from Infisical `prod` `/registry` and checks `/-/ping` and
`/-/npm/v1/keys`. `release.yml` gains a `prerelease` dispatch that publishes the five tooling presets as
`0.1.0-next.<n>` under `next`. The README carries the owner runbook, from the resources to a clean-folder install.
