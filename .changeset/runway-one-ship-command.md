---
"@stackra/cli": minor
---

`stackra deploy --env <environment>` is now the one command for a product repository: when the root `runway.yaml`
declares `surfaces` or `mobile`, its `web` and `mobile` kinds run the product publish (the edge KV rows, the R2
uploads and the EAS submits that `stackra deploy --product` runs), scoped by `--kind`, and every other kind
(services, desktop, docs) goes through Runway's `deploy()`, under the same approval check and deploy lock. The product
publish flags (`--assets-bucket`, `--served`, `--region` and the rest) pass through. A failed product publish stops
the run before the other kinds. `stackra deploy --product` stays as the alias products' CI already calls (STA-1972).
