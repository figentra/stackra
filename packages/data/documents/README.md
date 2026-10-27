<!-- Stackra file contract: Purpose: the guide to @stackra/documents. Boundary: describes this package only. Runtime: docs. Governing contract: ADR 0365; ADR 0356. -->

# @stackra/documents

One print-document template model rendered to HTML, PDF and DOCX ([ADR 0365](../../../apps/docs/src/docs/adr/0365-documents-one-print-template-model-three-renderers-and-the-e-signature-port.mdx)).
A template is studio data of the builder kind `print` (ADR 0270): page, one or two locales, a bilingual layout and
blocks. Receipts, invoices, packing slips, labels, line sheets, certificates, report cards, letters and signed forms are
templates, never code. This package also holds the `PdfEngine`, `PdfAssembler` and `ESignatureProvider` ports, the
`gotenberg` drivers of the two PDF ports, the binding of `@stackra/fiscal`'s `HybridPdf`, and the default e-signature
connector, Documenso self-hosted.

**Tier:** `tier:lib` (`packages/data/documents`). Entries `.` and `./contracts`. Depends on `@stackra/config`, `@stackra/container`,
`@stackra/contracts`, `@stackra/errors`, `@stackra/integrations`, `zod`, `docx` (DOCX writing) and `uqr` (QR encoding).

## What is here

| Symbol                                                                              | Use                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `renderDocument`                                                                    | template + data → HTML, PDF (through `PdfEngine`) or DOCX, with content hash                                                                                                                                          |
| `parseDocumentTemplate`, `resolveDocument`                                          | the steps: check the template, fill it with data                                                                                                                                                                      |
| `renderHtml`, `renderDocx`                                                          | the renderers of a resolved document                                                                                                                                                                                  |
| `signForm`, `verifyContentHash`, `contentHashOf`                                    | a form signed on a device as a PDF with its hashes; checking a stored file                                                                                                                                            |
| `spellAmount`                                                                       | an amount in words (tafqeet), with the currency's names from the market pack                                                                                                                                          |
| `encodeQr`, `encodeEan13`                                                           | the QR matrix of a text; the bars and digits of an EAN-13 (GTIN) barcode                                                                                                                                              |
| `shapeArabic`, `toVisualOrder`                                                      | Arabic shaping and bidi order for printers and displays that cannot do it                                                                                                                                             |
| `MemoryESignatureDriver`                                                            | the `memory` driver of `ESignatureProvider` (tests, sandboxes)                                                                                                                                                        |
| `ConnectionESignatureDriver`, `DocumensoIntegration`, `DocumensoConnection`         | the `connection` driver of `ESignatureProvider` (ADR 0356 per call) and the Documenso connector it routes to                                                                                                          |
| `GotenbergPdfEngineDriver`, `GotenbergPdfAssemblerDriver`                           | the `gotenberg` drivers of `PdfEngine` (headless Chromium, shapes Arabic) and `PdfAssembler` (merge, Factur-X hybrid), given a `GotenbergEndpoint`                                                                    |
| `HybridPdfBinding`                                                                  | fiscal's `HybridPdf` (`attach`) made by the bound `PdfAssembler`                                                                                                                                                      |
| `LABEL_PURPOSE`                                                                     | the purpose codes of the shelf, food and short-dated label templates                                                                                                                                                  |
| `DocumentFormat`, `PRINT_DOCUMENT_KIND`, the two schemas                            | the format enum with media types, the kind code, the shipped zod schemas                                                                                                                                              |
| eight refusals                                                                      | `invalid_document_template`, `document_value`, `amount_words_unavailable`, `signature_envelope_not_found`, `signature_not_complete`, `signature_envelope_closed`, `signature_signer_unreachable`, `pdf_engine_failed` |
| `./contracts`: `PdfEngine`, `PdfAssembler`, `ESignatureProvider`, `SignatureStatus` | the ports and the normalised envelope status                                                                                                                                                                          |

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

## PDF engine, merging and hybrid invoices

```ts
import {
  GotenbergPdfAssemblerDriver,
  GotenbergPdfEngineDriver,
  HybridPdfBinding,
} from "@stackra/documents";

const endpoint = {
  url: connection.url,
  timeoutMs: connection.timeoutMs,
  headers: connection.headers,
};
const pdfEngine = new GotenbergPdfEngineDriver(endpoint); // prints renderHtml output in headless Chromium
const assembler = new GotenbergPdfAssemblerDriver(endpoint);

const batch = await assembler.merge(labelPdfs); // one file for the label printer, in the order given
const hybrid = new HybridPdfBinding(assembler); // bind under @stackra/fiscal's HybridPdf token
```

The engine is a [Gotenberg](https://gotenberg.dev) container (headless Chromium plus QPDF). Chromium shapes Arabic
and lays out mixed-direction text from the `dir`, `lang` and `<bdi>` in the HTML, so the engine image must hold the
template's font families. Its URL, timeout and headers are the deployment's Connection (ADR 0356), never defaults.
`merge` keeps the caller's order; `hybrid` uses the engine's Factur-X route, which embeds the XML, writes the XMP
facts and converts to PDF/A-3b (the engine names the file `factur-x.xml`, or `xrechnung.xml` for XRECHNUNG).

## E-signature

`ConnectionESignatureDriver` binds `ESignatureProvider` to the provider ADR 0356 picks for the capability
`e-signature`: the scope's own Connection, else the Market's platform one. The default connector is Documenso,
self-hosted (owner decision R2-6): a `DocumensoConnection` holds the instance's `host`, its API key (`@Secret`
`DOCUMENSO_API_KEY`) and `timeoutMs` for the PDF upload and download.

```ts
import { ConnectionESignatureDriver, DocumensoConnection } from "@stackra/documents";
import { SignatureStatus } from "@stackra/documents/contracts";

const provider = new ConnectionESignatureDriver(resolver, { documenso: DocumensoConnection });
const envelope = await provider.send(request); // id "documenso:conn_…:42"
if ((await provider.status(envelope.id)).status === SignatureStatus.Signed)
  await files.store(await provider.download(envelope.id));
```

Documenso signs by email link, so every signer needs an email (`signature_signer_unreachable` otherwise). A cancelled
envelope is deleted at Documenso, so a later `status` is not found. **Certification pending:** written from
Documenso's public API v1 documentation and recorded answers; not yet run against a live instance.

## Labels

Shelf, food and short-dated labels are templates with a `purpose` of `LABEL_PURPOSE.Shelf`, `.Food` or `.ShortDated`.
They use the `barcode` block (`symbology: "ean-13"`, twelve digits get their check digit, a price-embedded in-store
code for weighed goods works too; pass codes as strings, a number is formatted in the locale) and the `struck` text
role for the old price of a reduced item. What each label shows, its size and its wording are the template's.

## Configuration, not code

Nothing here names a country, a currency, a provider or a paper size. Page sizes, fonts, wording and layouts are the
template's; currency names and the minor-unit exponent are the market pack's; which e-signature provider runs is the
tenant's Connection or the Market's default (ADR 0356), and its price is a rate card.

## Not here

- Other PDF engines: another `PdfEngine` or `PdfAssembler` driver lives with the runtime that hosts its engine.
- Hosting the engine: the Gotenberg container is the deployment's (runway), not this package's.
- Other e-signature providers (DocuSign, Nafath, UAE Pass): Connections in the OS integrations service (R3-8), passed
  to `ConnectionESignatureDriver` in the host's map.
- Tax QR payloads and e-invoice XML: `@stackra/fiscal`. Storing, versioning and watermarking files: OS files.
- The studio surface of the `print` kind: `@stackra/builder`.
