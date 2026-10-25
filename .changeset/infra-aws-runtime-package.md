---
"@stackra/infra-aws-runtime": minor
---

Add `@stackra/infra-aws-runtime`, the Pulumi program part for the AWS runtime resources members declare in runway
(ADR 0296, 0171): `runtimePlan` derives one environment's SQS queues (dead-letter queues, an SNS topic each on the
`sns-sqs` provider), the shared and dedicated Valkey caches and the S3 buckets from the root and service runways, and
`./node` adds `readRuntimePlan` (reads `runway.yaml` and `services/*/runway.yaml`) and `awsRuntime`, which declares
them encrypted, private and tagged by environment, member and topology group.
