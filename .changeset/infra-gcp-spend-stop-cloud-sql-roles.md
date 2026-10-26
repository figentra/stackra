---
"@stackra/infra-gcp": minor
---

Read each deployment's project from the runway `cloud` (replacing `providers.gcp.environments`) and its region from its
GCP regions, support dedicated tenants, add the billing-detach spend stop at `budgets.stopNonProdAt`, the `gcpRuntime`
stack with Cloud SQL backups kept in the region and point-in-time recovery, deploy roles narrower than `roles/owner`,
the service account id guard while the runway is read, and the `GcpHealthIndicatorDriver` (ADR 0400, ADR 0401).
