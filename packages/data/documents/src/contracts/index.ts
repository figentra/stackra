/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/documents, the leaf entry of its ports (`PdfEngine`,
 *          `PdfAssembler`, `ESignatureProvider`), the `SignatureStatus` enum and the types their signatures name, until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf: it imports no other entry of this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { SignatureStatus } from "#contracts/enums/signature-status.enum";
export { ESignatureProvider } from "#contracts/ports/e-signature-provider.port";
export { PdfAssembler } from "#contracts/ports/pdf-assembler.port";
export { PdfEngine } from "#contracts/ports/pdf-engine.port";
export type { HybridPdfInput } from "#contracts/types/hybrid-pdf-input.type";
export type { PdfPage } from "#contracts/types/pdf-page.type";
export type { SignatureEnvelope } from "#contracts/types/signature-envelope.type";
export type { SignatureRequest } from "#contracts/types/signature-request.type";
export type { SignatureSigner } from "#contracts/types/signature-signer.type";
