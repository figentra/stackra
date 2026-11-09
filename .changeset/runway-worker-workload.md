---
"@stackra/runway": minor
"@stackra/infra-aws-runtime": minor
---

A worker workload needs no port: `port` and `health` are optional unless the workload is `public`, and an internal
worker may name `healthCommand`, which becomes its Fargate container's health check (no port mapping is declared).
