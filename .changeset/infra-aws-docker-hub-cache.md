---
"@stackra/infra-aws": minor
---

The account's first environment creates ECR's pull-through cache for Docker Hub: a rule serving
`<account>.dkr.ecr.<region>.amazonaws.com/docker-hub/<image>` from `registry-1.docker.io`, and the
`ecr-pullthroughcache/docker-hub` secret it authenticates with, created empty for the owner to fill. The baseline
outputs `dockerHubCacheSecretArn`. Runway workloads (Gotenberg, Chatwoot) pull third-party images through it.
