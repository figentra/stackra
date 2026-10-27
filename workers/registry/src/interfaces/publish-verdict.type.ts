/**
 * Stackra file contract:
 * Purpose: `PublishVerdict`: the verdict of `checkPublish`.
 * Boundary: pure; the size limit, the immutability check and the provenance check are the publish handler's.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 7, 8 and 11); ADR 0316 (decision 2); ADR 0024 (decision 5); ADR 0013.
 */
import type { StackraKind } from "#src/interfaces/stackra-kind.type";

/** The verdict of `checkPublish`. */
export type PublishVerdict =
  | { readonly ok: true; readonly kind: StackraKind }
  | { readonly ok: false; readonly reasons: readonly string[] };
