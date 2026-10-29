---
"@stackra/panel": patch
---

The panel catalogues ship the derived labels of every enum case in all seven locales: `ExportFormat` `jsonl` and `pdf`,
`FilterComparison` (`gt`, `gte`, `lt`, `lte`, `ne`), `ViewLayout` and `ViewSharing` `role`, so gen no longer refuses
them as `i18n_key_missing`.
