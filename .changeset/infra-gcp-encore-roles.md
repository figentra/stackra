---
"@stackra/infra-gcp": minor
---

Grant Encore Cloud least-privilege roles on GCP (ADR 0435): when an environment's `destinations.services` is
`encore-cloud` and `providers.gcp.encore.serviceAccount` is set, `gcpBaselineConfig` carries `encore` and `gcpBaseline`
binds that service account to each of `ENCORE_ROLES` on the project instead of `roles/owner`. A principal that is not a
service account email is refused.
