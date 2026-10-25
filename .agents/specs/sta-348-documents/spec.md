# Feature Specification: `@stackra/documents`, one print template model, three renderers and the e-signature port

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-25

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/documents` (category `data`, approved, not on disk) from its row in
`notes/handover/stackra-package-needs.md`: one template model to HTML, PDF and DOCX; Arabic shaping and bidi;
bilingual layouts; QR; amount in words (tafqeet); print-document kind; signed form PDFs with the signature image and a
content hash; an e-signature port. Conflict 4 of that file is settled here: the e-signature port lives in this package.

## Impact

- **Apps touched**: none (`apps/docs` gains ADR 0365; the integrator adds it to the index)
- **Services touched**: none (OS invoicing, experience, files and workforce adopt it later)
- **Packages touched**: `packages/data/documents` (new member)
- **Cross-service events**: none
- **Tenancy and data**: none stored; render data passes through
- **Secrets**: none
- **ADR needed**: yes, ADR 0365 (Proposed)
- **New dependencies**: `docx` and `uqr` in a new `documents` catalog (MIT both); `zod` from the default catalog
- **Deploy modes**: same code in all; a PDF needs a bound `PdfEngine` driver
- **Licence tier**: free (MIT)
- **Docs to update**: `packages/data/documents/README.md`, `AGENTS.md`
- **Lane**: lite
- **Change risk**: R2 (legal documents: a wrong amount in words or a blank value is a defect a customer signs)

## Clarifications

### Session 2026-10-25

- Conflict 4 (recommended option, owner round 22): `ESignatureProvider` lives in `@stackra/documents/contracts`.
- Configuration, not code (ADR 0363): page sizes, fonts and wording are template data; currency names and exponent are
  market-pack data (`CurrencyWords`); provider choice is the Connection or the Market default (ADR 0356); price is
  `rate-card:e-signature`. Code holds only grammar per language and Unicode tables.
- PDF goes through a `PdfEngine` port (HTML printed by a browser-class engine) because in-process PDF libraries do not
  shape Arabic; its drivers live with the hosting runtime.
- A missing render value is refused with its path, never printed blank.

## User Scenarios

1. **A receipt in two languages (P1).** Commerce renders `commerce:print:receipt` with an order: the PDF shows Arabic
   and English side by side, the total in words in both languages, the tax QR and the lines.
2. **A consent form signed on a tablet (P1).** Beautilon renders the consent template with the client's drawn
   signature; the PDF, its content hash and the signature hash are stored by OS files.
3. **A Word draft (P2).** Juristra renders an engagement letter to DOCX for editing, right-to-left paragraphs intact.
4. **An e-signature envelope (P2).** Juristra sends a PDF to the tenant's e-signature provider and downloads the
   signed copy once `signed`.
5. **A label printer (P3).** A device driver prints an Arabic product name with `shapeArabic` and `toVisualOrder`.

## Requirements

- **FR-001** The member follows the package standard: `tier:lib`, entries `.` and `./contracts`, one declaration per
  file, file contracts, catalogs only.
- **FR-002** `DOCUMENT_TEMPLATE_SCHEMA` and `parseDocumentTemplate` define and check the `print` kind template (page,
  locales with direction and font, layout, six block kinds); a broken template is `invalid_document_template`.
- **FR-003** `resolveDocument` fills placeholders, tables, QR, images, signatures and amounts in words; a missing or
  unusable value is `document_value` with its path.
- **FR-004** `renderHtml`, `renderDocx` and `renderDocument` write HTML, DOCX and PDF (through `PdfEngine`) with media
  type and content hash; HTML escapes every text and loads nothing external.
- **FR-005** Bilingual layouts `side-by-side` and `stacked`; values bidi-isolated; `shapeArabic` and `toVisualOrder`
  for non-shaping devices.
- **FR-006** `spellAmount` spells minor units with market-pack names in Arabic and English; otherwise
  `amount_words_unavailable`.
- **FR-007** `signForm` returns the signed PDF with its content hash and the signature hash; `verifyContentHash`
  checks stored bytes.
- **FR-008** `ESignatureProvider` port with `SignatureStatus` and a `memory` driver; idempotent `send`; refusals
  `signature_envelope_not_found`, `signature_not_complete`, `signature_envelope_closed`.

## Success Criteria

- **SC-001** Every row item above exists as code with a test beside it.
- **SC-002** A changeset and ADR 0365 (Proposed) are written.
- **SC-003** Tests, typecheck and build pass once the member is linked (separate testing workflow).
- **SC-004** No country, currency, provider or paper size appears in `src/` outside tests.
