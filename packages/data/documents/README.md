# @stackra/documents

One print-document template model rendered to HTML, PDF and DOCX ([ADR 0365](../../../apps/docs/src/adr/0365-documents-one-print-template-model-three-renderers-and-the-e-signature-port.mdx)).
A template is studio data of the builder kind `print` (ADR 0270): page, one or two locales, a bilingual layout and
blocks. Receipts, invoices, packing slips, labels, line sheets, certificates, report cards, letters and signed forms are
templates, never code. This package also holds the `ESignatureProvider` port.

**Tier:** `tier:lib` (`packages/data/documents`). Entries `.` and `./contracts`. Depends on `@stackra/container`,
`@stackra/contracts`, `@stackra/errors`, `zod`, `docx` (DOCX writing) and `uqr` (QR encoding).

## What is here

| Symbol                                                              | Use                                                                                                                                                              |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `renderDocument`                                                    | template + data → HTML, PDF (through `PdfEngine`) or DOCX, with content hash                                                                                     |
| `parseDocumentTemplate`, `resolveDocument`                          | the steps: check the template, fill it with data                                                                                                                 |
| `renderHtml`, `renderDocx`                                          | the renderers of a resolved document                                                                                                                             |
| `signForm`, `verifyContentHash`, `contentHashOf`                    | a form signed on a device as a PDF with its hashes; checking a stored file                                                                                       |
| `spellAmount`                                                       | an amount in words (tafqeet), with the currency's names from the market pack                                                                                     |
| `encodeQr`                                                          | the QR matrix of a text                                                                                                                                          |
| `shapeArabic`, `toVisualOrder`                                      | Arabic shaping and bidi order for printers and displays that cannot do it                                                                                        |
| `MemoryESignatureDriver`                                            | the `memory` driver of `ESignatureProvider` (tests, sandboxes)                                                                                                   |
| `DocumentFormat`, `PRINT_DOCUMENT_KIND`, the two schemas            | the format enum with media types, the kind code, the shipped zod schemas                                                                                         |
| six refusals                                                        | `invalid_document_template`, `document_value`, `amount_words_unavailable`, `signature_envelope_not_found`, `signature_not_complete`, `signature_envelope_closed` |
| `./contracts`: `PdfEngine`, `ESignatureProvider`, `SignatureStatus` | the ports and the normalised envelope status                                                                                                                     |

## Rendering

```ts
import { DocumentFormat, renderDocument } from "@stackra/documents";

const receipt = await renderDocument({
  template, // the published studio template `commerce:print:receipt`
  data: { order, currency: marketPack.currency.words },
  format: DocumentFormat.Pdf,
  pdfEngine, // the PdfEngine bound for this deployment
});
await files.store(receipt.bytes, { contentHash: receipt.contentHash });
```

A missing value is refused (`document_value` with its path), never printed blank. Values are bidi-isolated (`<bdi>` in
HTML, runs in DOCX); the engine that prints the HTML shapes Arabic. `shapeArabic` and `toVisualOrder` are only for a
device that draws characters one by one.

## Configuration, not code

Nothing here names a country, a currency, a provider or a paper size. Page sizes, fonts, wording and layouts are the
template's; currency names and the minor-unit exponent are the market pack's; which e-signature provider runs is the
tenant's Connection or the Market's default (ADR 0356), and its price is a rate card.

## Not here

- PDF engines: drivers of `PdfEngine` live with the runtime that hosts the engine.
- E-signature providers: integrations connectors implement `ESignatureProvider`.
- Tax QR payloads and e-invoice XML: `@stackra/fiscal`. Storing, versioning and watermarking files: OS files.
- The studio surface of the `print` kind: `@stackra/builder`.
