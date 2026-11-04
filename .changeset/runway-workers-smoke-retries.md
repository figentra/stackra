---
"@stackra/runway": patch
---

The `cloudflare-workers` provider retries each smoke check (60 attempts, 10 s apart) while a new version or a new
domain's certificate comes up, and a check can send `Authorization: Bearer` from a named variable. `smoke` is now a
list of `{ url, bearer? }`, and `secrets` may be a map that reads a Worker secret from another variable
(`TURBO_CACHE_TOKEN: TURBO_TOKEN`).
