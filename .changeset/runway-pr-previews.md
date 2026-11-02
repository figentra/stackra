---
"@stackra/runway": minor
"@stackra/app": minor
"@stackra/cli": minor
---

Runway publishes a pull request's preview (STA-1907, ADR 0289 decision 7).

- `publishProduct({ environment: "preview", pullRequest: n })` uploads the console bundle and writes
  `host:pr-<n>.figentra.cloud` and `release:<product>:console:pr-<n>`, both expiring after 7 days, with no canary; the
  answer carries `host`. `pullRequestPreviewHost` and `PULL_REQUEST_PREVIEW_SETTINGS` are exported.
- `EdgeKvWriter.put(key, value, ttlSeconds?)` takes an optional expiry; `WranglerEdgeKvDriver` passes it as `--ttl`.
- The product command takes `--pr <n>` (or `STACKRA_PULL_REQUEST`) with `--env preview`, and prints the host.
