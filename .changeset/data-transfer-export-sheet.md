---
"@stackra/data-transfer": minor
---

Add `exportSheet`: the sheet a tenant export or backup writes for one model's records, without the classified columns the
export does not opt in, and never a `credential` column, even opted in (ADR 0494).
