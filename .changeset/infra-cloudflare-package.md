---
"@stackra/infra-cloudflare": minor
---

Add `@stackra/infra-cloudflare`, the Cloudflare half of the core Pulumi stack (ADR 0171): `cloudflareCoreStack` and its
parts declare the zones the root runway names (imported and protected) with their records, Worker custom domains and
Cloudflare for SaaS fallback origin, the runway edge per plan (TLS, the managed WAF, bots, the per-IP rate limit and the
API cache bypass), a named dev tunnel per machine, Access in front of the dev zone and the operator surfaces, and the R2
buckets with the Turborepo cache's 7-day expiry; `.` checks the runway `edge` block and the stack config and plans the
tunnel ingress and the rate-limit windows.
