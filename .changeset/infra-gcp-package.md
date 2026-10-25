---
"@stackra/infra-gcp": minor
---

Add `@stackra/infra-gcp`, the free GCP foundation as Pulumi programs read from the root runway (ADR 0354): per
environment `gcpBaseline` (a provider pinned to the project and region with cost labels, a rotating Cloud KMS key, the
files bucket with uniform access, the media CORS rule and expiry rules, the GitHub Workload Identity infra service
account and, once per project, a billing budget notifying a Pub/Sub topic), the config reader `gcpBaselineConfig`,
`resolveRef`, and `./testing` with `mockPulumi` and `outputOf`. Region, projects, billing account, currency and
amounts are runway data.
