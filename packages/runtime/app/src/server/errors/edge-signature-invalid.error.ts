/**
 * Stackra file contract:
 * Purpose: `EdgeSignatureInvalidError`, the refusal the edge-header guard answers when a request to a non-public
 *          endpoint carries no edge signature, a wrong one, one older than the validity window, or a request id
 *          already seen (a replay).
 * Boundary: a refusal, so the generated adapter maps it to 401 and nobody reports it; code `edge_signature_invalid`.
 *           It says nothing about which check failed, so a prober learns nothing.
 * Runtime: node
 * Governing contract: ADR 0140 (error envelope and kinds); ADR 0437 (decision 4; Enforcement).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The edge signature is missing, invalid, stale or replayed.
 *
 * @example
 * throw EdgeSignatureInvalidError.create();
 */
export class EdgeSignatureInvalidError extends Refusal({ kind: ErrorKind.Unauthenticated }) {}
