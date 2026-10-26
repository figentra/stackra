---
"@stackra/infra-aws": minor
---

Refuse backups that would leave an environment region's jurisdiction, name the jurisdiction in the config, hold the
static egress addresses `shared.network.egress.staticIps` asks for and export them for partner allow-lists
(`egressIps`, `egressAllocationIds`), and add the `AwsHealthIndicatorDriver` (ADR 0402).
