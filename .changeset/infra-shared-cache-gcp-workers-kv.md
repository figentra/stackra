---
"@stackra/infra-gcp": minor
"@stackra/infra-cloudflare": minor
---

Provision the shared cache on GCP and Cloudflare. `gcpRuntimeConfig` reads `shared.cache` (`engine: valkey`, node
type, shards, replicas, eviction, `auth`, `subnet`) and `gcpRuntime` creates a Memorystore for Valkey instance on the
deployment's VPC over Private Service Connect, encrypted in transit, with IAM sign-in unless `auth: none`, and the
VPC's `gcp-memorystore` connection policy when `subnet` is named; it exports `cacheInstance` and `cacheEndpoint`.
`GcpRuntimeConfig` gains `cache` and `GcpRuntimeOutputs` gains `cacheInstance` and `cacheEndpoint`. In
`@stackra/infra-cloudflare`, `workersCacheNamespaces(root)` names the Workers KV namespace of each environment whose
default cache driver is `workers`, and `cloudflareCoreStack` declares them and returns them as `caches`.
