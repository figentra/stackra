---
"@stackra/actions": patch
"@stackra/iam": patch
---

The memory `AccessControl` runs record policies: `ctx.authorize(record)` asks the record's policy, as
`IamAccessControlDriver` does, once `@stackra/iam`'s testing plugin has connected them through the new
`connectRecordPolicies`. A module's "refuses another customer" test now means it on memory drivers. The IAM driver's
policy helpers move into `decidePolicy`, `policyRowOf` and `isAnonymousCall`, shared by the driver and the plugin.
