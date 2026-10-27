---
"@figentra/worker-registry": patch
---

Migration `0003_figentra_brand.sql` (owner decision D9): the `@figentra` scope with the `internal` read rule and the
`commercial` licence rule, and its trusted publisher `figentra/brand` (release workflow, `refs/heads/main`,
environment `brand-registry`) for the brand kits `@figentra/brand-<id>`. Only an internal licence with an
`@figentra` grant reads them; the catalogue never lists them.
