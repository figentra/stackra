---
"@stackra/runway": minor
---

`runway drift [env]` compares what the `cloudflare-workers` provider renders from `runway.yaml` with what Cloudflare
reports for each Worker (ADR 0519 decision 7, STA-1992), prints the settings that differ and exits 1 on any. It only
reads, with `CLOUDFLARE_API_TOKEN_READ`. `CloudflareWorkersProviderDriver.drift` and `diffWorkerSettings` are the same
check as code.
