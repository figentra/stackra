---
"@stackra/infra-cloudflare": minor
---

Add `registryWorker` to `./node` (ADR 0453): the Stackra registry Worker's protected R2 bucket and D1 database, its KV
cache namespace and the `npm.stackra.figentra.com` Worker Custom Domain, with an optional import id to adopt the
domain from the npflared Worker.
