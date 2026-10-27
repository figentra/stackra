/**
 * Stackra file contract:
 * Purpose: `StackraManifest`: the `stackra` field of an item's package.json; its per-kind schema is stackra-184's.
 * Boundary: types and the kinds list only. Stand-in: ADR 0453 names `@stackra/skills/contracts` as the home of these
 *           shapes (stackra-184, not built yet); when it lands, the Worker imports them from there and these local
 *           copies go.
 * Runtime: worker
 * Governing contract: ADR 0453 (decisions 11 and 12).
 */
import type { StackraKind } from "#src/interfaces/stackra-kind.type";

/** The `stackra` field of an item's package.json; its per-kind schema is stackra-184's. */
export interface StackraManifest {
  /** The Stackra kind the package declares. */
  readonly kind: StackraKind;
  readonly [field: string]: unknown;
}
