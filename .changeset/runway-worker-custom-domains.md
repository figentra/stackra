---
"@stackra/runway": minor
---

A Worker's Custom Domains are runway settings (ADR 0519): `customDomains: [host]` on a `targets.cloudflare-workers` member, its defaults or an environment override. The renderer writes each host as a wrangler `routes` entry with `custom_domain: true`, and refuses a member whose `wrangler.jsonc` still holds `routes`.
