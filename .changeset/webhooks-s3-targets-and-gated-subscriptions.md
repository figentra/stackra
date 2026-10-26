---
"@stackra/webhooks": minor
---

Deliver to `s3://bucket/prefix` endpoints as signed objects through the `WebhookObjectSink` port
(`S3WebhookObjectSinkDriver`, `WebhookObjectSinkFake`), and gate outbound events by entitlement through
`WebhookEntitlementSource`: refused at registration and skipped at fan-out without the grant (ADR 0422).
