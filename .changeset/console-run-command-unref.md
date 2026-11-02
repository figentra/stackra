---
"@stackra/console": patch
---

The audit-settle delay unrefs its timer by shape, so the file type-checks where `setTimeout` is the DOM `number` form.
