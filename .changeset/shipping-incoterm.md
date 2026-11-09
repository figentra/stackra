---
"@stackra/shipping": minor
---

`Incoterm` (DAP, DDP) on `RateRequest`, `RateQuote` and `LabelRequest`, and the shipper's customs ids (`CustomsId`, `CustomsIdKind`: EORI, IOSS, EIN, VAT) on `LabelRequest`. A connector that cannot honour DDP refuses with `ddp_unsupported` and never quotes or books DAP instead.
