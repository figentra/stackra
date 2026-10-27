---
"@stackra/documents": minor
---

Add the `gotenberg` drivers of `PdfEngine` (headless Chromium, which shapes Arabic) and of the new `PdfAssembler` port
(merge several PDF labels into one file; Factur-X hybrid invoices as PDF/A-3b), `HybridPdfBinding` for
`@stackra/fiscal`'s `HybridPdf`, the `pdf_engine_failed` refusal, the EAN-13 `barcode` block (`encodeEan13`), the
`struck` text role, the template `purpose` code and `LABEL_PURPOSE` for shelf, food and short-dated labels. QR values
uqr cannot encode are now refused as `document_value` with the block's path.
