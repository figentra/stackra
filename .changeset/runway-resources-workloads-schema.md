---
"@stackra/runway": minor
---

Add `resources` and `workloads` to the root runway, `environments.<env>.limits.monthly`, and `uses` on service runways
(STA-1641, ADR 0493). A resource is `postgres` (RDS or Aurora, a major version), `queue`, `topic`, `cache` or `bucket`
with a size per environment; Kafka, OpenSearch and SES are reserved and refused. A workload is a container pinned by
digest with a port, health path, `internal` or `public` exposure, the resources it uses, public env, secret names, a
size and task count per environment, and a required reason; a `uses` that names no resource is refused. Adds the
`ResourceKind` and `ResourceSize` enums and the canonical schema copies.
