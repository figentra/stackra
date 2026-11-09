---
"@stackra/infra-aws-runtime": patch
---

A public workload's load balancer keeps a quiet connection for 180 s instead of the ALB default of 60, so an AI answer
streamed as server-sent events (60 to 120 s, a ping every 15 s) is not cut mid-stream.
