/**
 * Stackra file contract:
 * Purpose: `REFUSAL_REFS`, every refusal ref this client has loaded, by the code an envelope carries
 *          (`variant_not_found`), so a decoded refusal is an instance of the producer's refusal class.
 * Boundary: filled by `refusalRef` when a generated client module loads; read by `decodeRefusal`. Two modules may share a
 *           code, so each code keeps a list and the module of the envelope's action picks between them. Not exported
 *           from an entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope); ADR 0232 (codes).
 */
import type { RefusalRef } from "#core/types/refusal-ref.type";

/** Loaded refusal refs by unqualified code. */
export const REFUSAL_REFS = new Map<string, RefusalRef[]>();
