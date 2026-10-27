---
"@stackra/infra-cloudflare": minor
---

Add the login directory Worker's Cloudflare side (ADR 0451, STA-752): `loginDirectoryHandler` (identifier to regions by
keyed hash over KV), `loginDirectoryKvRequest` (a region's KV bulk put and delete) and the `LoginDirectoryKv` and
`LoginDirectoryOptions` types in `.`; `loginDirectoryWorker` (global KV namespace and routes) in `./node`.
