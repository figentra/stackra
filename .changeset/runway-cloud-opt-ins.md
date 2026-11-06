---
"@stackra/runway": minor
---

A product's root runway opts in to the cloud estate figentra/infra vends (ADR 0524): `providers.aws.account: true` for its one AWS account and `providers.gcp.project: true` for its one GCP project, both false by default, with `providers.gcp.apis` naming the `*.googleapis.com` services infra enables. An environment's `region` fixes its cloud (me and eu run in AWS, ksa in Google Cloud), so `runway validate` refuses a ksa environment without `providers.gcp.project: true` and warns on an AWS account no me or eu environment uses. An environment's `cloud` is deprecated and warns. Runway exports `unusedCloudOptIns`.
