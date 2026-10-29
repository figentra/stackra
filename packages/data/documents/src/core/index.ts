/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/documents, which has several public files, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The ports and `SignatureStatus` are exported from
 *           `./contracts` only. Internal helpers (path reading, placeholder filling, escaping, the spellers per
 *           language, the QR PNG writer, the Gotenberg form poster, base64 and hex) are not exported.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { DocumentsConfig } from "#config/documents.config";
export { HybridPdfBinding } from "#core/bindings/hybrid-pdf.binding";
export { CURRENCY_WORDS_SCHEMA } from "#core/constants/currency-words-schema.constant";
export { DOCUMENT_TEMPLATE_SCHEMA } from "#core/constants/document-template-schema.constant";
export { DOCUMENTS_CONFIG_SCHEMA as DocumentsConfig$ } from "#core/constants/documents-config-schema.constant";
export { LABEL_PURPOSE } from "#core/constants/label-purpose.constant";
export { PRINT_DOCUMENT_KIND } from "#core/constants/print-document-kind.constant";
export { ConnectionESignatureDriver } from "#core/drivers/connection-e-signature.driver";
export { DocumensoConnection } from "#core/drivers/documenso.connection";
export { DocumensoIntegration } from "#core/drivers/documenso.integration";
export { GotenbergPdfAssemblerDriver } from "#core/drivers/gotenberg-pdf-assembler.driver";
export { GotenbergPdfEngineDriver } from "#core/drivers/gotenberg-pdf-engine.driver";
export { MemoryESignatureDriver } from "#core/drivers/memory-e-signature.driver";
export { DocumentFormat } from "#core/enums/document-format.enum";
export { AmountWordsUnavailableError } from "#core/errors/amount-words-unavailable.error";
export { DocumentValueError } from "#core/errors/document-value.error";
export { InvalidDocumentTemplateError } from "#core/errors/invalid-document-template.error";
export { PdfEngineFailedError } from "#core/errors/pdf-engine-failed.error";
export { SignatureEnvelopeClosedError } from "#core/errors/signature-envelope-closed.error";
export { SignatureEnvelopeNotFoundError } from "#core/errors/signature-envelope-not-found.error";
export { SignatureNotCompleteError } from "#core/errors/signature-not-complete.error";
export { SignatureSignerUnreachableError } from "#core/errors/signature-signer-unreachable.error";
export { contentHashOf } from "#core/functions/content-hash-of.function";
export { encodeEan13 } from "#core/functions/encode-ean13.function";
export { encodeQr } from "#core/functions/encode-qr.function";
export { parseDocumentTemplate } from "#core/functions/parse-document-template.function";
export { renderDocument } from "#core/functions/render-document.function";
export { renderDocx } from "#core/functions/render-docx.function";
export { renderHtml } from "#core/functions/render-html.function";
export { resolveDocument } from "#core/functions/resolve-document.function";
export { shapeArabic } from "#core/functions/shape-arabic.function";
export { signForm } from "#core/functions/sign-form.function";
export { spellAmount } from "#core/functions/spell-amount.function";
export { toVisualOrder } from "#core/functions/to-visual-order.function";
export { verifyContentHash } from "#core/functions/verify-content-hash.function";
export { PdfTableWriter } from "#core/writers/pdf-table.writer";
export type { CurrencyWords } from "#core/types/currency-words.type";
export type { DocumentTemplate } from "#core/types/document-template.type";
export type { ESignatureConnection } from "#core/types/e-signature-connection.type";
export type { GotenbergEndpoint } from "#core/types/gotenberg-endpoint.type";
export type { ImageAsset } from "#core/types/image-asset.type";
export type { ParsedDocumentTemplate } from "#core/types/parsed-document-template.type";
export type { QrMatrix } from "#core/types/qr-matrix.type";
export type { RenderedDocument } from "#core/types/rendered-document.type";
export type { ResolvedBlock } from "#core/types/resolved-block.type";
export type { ResolvedDocument } from "#core/types/resolved-document.type";
export type { SignedForm } from "#core/types/signed-form.type";
export type { SignerInput } from "#core/types/signer-input.type";
export type { TextPart } from "#core/types/text-part.type";
