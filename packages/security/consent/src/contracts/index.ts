/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/consent, the leaf entry of its ports (the verifier among them) and the
 *          enum and types the ports' signatures name, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf: it imports no other entry of this package. Each
 *           symbol here is exported from this entry only (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { ConsentVerificationMethod } from "#contracts/enums/consent-verification-method.enum";
export { ConsentAuthority } from "#contracts/ports/consent-authority.port";
export { ConsentProofStore } from "#contracts/ports/consent-proof-store.port";
export { ConsentStore } from "#contracts/ports/consent-store.port";
export { ConsentVerifier } from "#contracts/ports/consent-verifier.port";
export type { ConsentProof } from "#contracts/types/consent-proof.type";
export type { ConsentRecord } from "#contracts/types/consent-record.type";
export type { ConsentVerification } from "#contracts/types/consent-verification.type";
export type { ConsentVerificationRequest } from "#contracts/types/consent-verification-request.type";
