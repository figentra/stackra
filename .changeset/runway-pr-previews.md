---
"@stackra/runway": minor
"@stackra/app": minor
"@stackra/cli": minor
---

Runway publishes a pull request's preview (STA-1907, ADR 0289 decision 7).

- `publishProduct({ environment: "preview", pullRequest: n })` uploads the console bundle and writes
  `host:<product>-pr-<n>.figentra.cloud` and `release:<product>:console:pr-<n>`, both expiring after 7 days, with no canary; the
  answer carries `host`. A host row another product holds is refused before any upload. `pullRequestPreviewHost(product, n)` and `PULL_REQUEST_PREVIEW_SETTINGS` are exported.
- `EdgeKvWriter.put(key, value, ttlSeconds?)` takes an optional expiry; `WranglerEdgeKvDriver` passes it as `--ttl`.
- `EdgeKvWriter.read(key)` answers the row or `null`; every driver implements it (wrangler's `kv key get --text`,
  where the API's 404 is `null`).
- The product command takes `--pr <n>` (or `STACKRA_PULL_REQUEST`) with `--env preview` (digits only), and prints the host.
