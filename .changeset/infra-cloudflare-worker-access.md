---
"@stackra/infra-cloudflare": minor
---

`workerAccess` puts Cloudflare Access in front of the `internal-tool` Worker members: one application over each
member's custom domains and one over its Version URLs (`*-<worker>.<subdomain>.workers.dev`), open to the GitHub
organisation. The core stack takes them from a new `internalTools` config, which needs `access` (ADR 0519 decision 4,
STA-1994).
