/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/app for the edge: the signed headers the edge Worker
 *          forwards and the API pipeline checks, the input the signature covers, the signing keys and seen-nonce ports
 *          the guard reads, the KV key prefixes and the KV writer port, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing; every file here is a leaf and imports nothing from the other
 *           folders. The package's `./contracts` export, `#contracts/*` import and tsdown entry are the owner's to add.
 * Runtime: isomorphic
 * Governing contract: ADR 0117 (decision 2); ADR 0294 (decision 15); ADR 0437 (not yet landed; draft in the app-shells handover, edge and extension sections 5 and 15;
 *                     decision 4: two keys, replay refusal).
 */
export { EdgeHeader } from "#contracts/enums/edge-header.enum";
export { EdgeKvPrefix } from "#contracts/enums/edge-kv-prefix.enum";
export { EdgeKvWriter } from "#contracts/ports/edge-kv-writer.port";
export { EdgeNonceStore } from "#contracts/ports/edge-nonce-store.port";
export { EdgeSigningKeys } from "#contracts/ports/edge-signing-keys.port";
export type { EdgeSignatureInput } from "#contracts/types/edge-signature-input.type";
