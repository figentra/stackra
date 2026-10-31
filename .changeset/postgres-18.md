---
"@stackra/infra-aws-runtime": patch
"@stackra/infra-gcp": patch
"@stackra/infra-tools": patch
---

Postgres 18 is the production major (STA-1691, ADR 0238 amendment of 2026-10-31): a `resources.postgres` without a
`version` plans 18, the GCP examples and messages name `POSTGRES_18`, and the tools stack's database task runs the pinned
`postgres:18.6-alpine` client.
