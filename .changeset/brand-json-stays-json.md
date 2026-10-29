---
"@stackra/repo-checks": patch
---

`stackra validate` accepts a product root's `brand.json`: the brand CLI (`figentra-brand pull`) reads and writes it as
strict JSON, so it joins `MUST_STAY_JSON` instead of failing the config check in every product.
