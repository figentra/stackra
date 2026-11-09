---
"@stackra/config": patch
---

Loading `@stackra/config/node` no longer needs `@aws-sdk/client-secrets-manager` installed. The AWS Secrets Manager store now imports the SDK, an optional peer, on its first `load()`, as the KMS client already did with `@aws-sdk/client-kms`.

Before this, a service whose tests loaded config's node entry failed at import unless it installed the peer (BILLING-A's usage service: 20 test files).
