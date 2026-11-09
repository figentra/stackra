---
"@stackra/repo-checks": patch
---

The runway unread-fields check no longer takes Pulumi's `aws.ecr` namespace (`new aws.ecr.PullThroughCacheRule(...)` in infra-aws's Docker Hub cache) for a read of the runway field `providers.aws.ecr`, which nothing reads yet. It made main's `validate --repository` fail twice.
