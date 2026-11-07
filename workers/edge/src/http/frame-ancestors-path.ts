/**
 * Stackra file contract:
 * Purpose: `FRAME_ANCESTORS_PATH`, where an owning product answers the framers of one path for the edge:
 *          `GET /.well-known/stackra/frame-ancestors?path=<path>` → `{ "origins": [...] }`, signed by the edge.
 * Boundary: a constant only; `originFrameAncestorResolver` calls it, and a product (Pay) serves it.
 * Runtime: worker
 * Governing contract: ADR 0437 (decision 2); ADR 0334 rule 12; STA-2562.
 */

/** Where the owning product answers the framers of one path. */
export const FRAME_ANCESTORS_PATH = "/.well-known/stackra/frame-ancestors";
