# Plan: `@stackra/documents`

**Spec**: `.agents/specs/sta-348-documents/spec.md`

## Design

- `./contracts` (leaf): `PdfEngine.print(html, page)` and `ESignatureProvider` (`send`, `status`, `download`,
  `cancel`), `SignatureStatus`, and the types `PdfPage`, `SignatureRequest`, `SignatureSigner`, `SignatureEnvelope`.
- `.`: the zod schemas (`DOCUMENT_TEMPLATE_SCHEMA`, `CURRENCY_WORDS_SCHEMA`), `PRINT_DOCUMENT_KIND`, `DocumentFormat`
  with media types, six refusals, the pipeline `parseDocumentTemplate` → `resolveDocument` → `renderHtml` /
  `renderDocx` / `PdfEngine`, wrapped by `renderDocument`; `signForm`, `contentHashOf`, `verifyContentHash`;
  `spellAmount` over internal `spellArabic` and `spellEnglish`; `encodeQr` (uqr) and an internal PNG writer for DOCX
  (platform `CompressionStream`); `shapeArabic` (Presentation Forms-B) and `toVisualOrder` (UAX #9 implicit rules on
  one line); `MemoryESignatureDriver`.
- Internal helpers (`readPath` own-property walk, `fillPlaceholders`, `formatValue` via `Intl`, `escapeHtml`, base64,
  hex) are not exported.

## Constitution Check

| Law                       | Result | Note                                                                                      |
| ------------------------- | ------ | ----------------------------------------------------------------------------------------- |
| Boundaries (ADR 0003)     | PASS   | imports `@stackra/container`, `contracts`, `errors`, `zod`, `docx`, `uqr`; no app/service |
| Secrets (ADR 0173)        | N/A    | none                                                                                      |
| Security                  | PASS   | templates checked by schema; HTML escaped; paths cannot reach prototypes; no fetch        |
| Configuration (ADR 0363)  | PASS   | no country, currency, provider or paper size in source                                    |
| Test placement (ADR 0022) | PASS   | tests in `src/**/__tests__/` beside each subject                                          |
| Versions and catalogs     | PASS   | `catalog:documents` for `docx` and `uqr` (new, integrator adds), `catalog:` for zod       |
| Docs and ADRs             | PASS   | ADR 0365 (Proposed), README, AGENTS                                                       |
