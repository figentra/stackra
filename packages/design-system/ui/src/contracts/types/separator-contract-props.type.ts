/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Separator` takes: its axis and its colour level. Each runtime's
 *          `SeparatorProps` is this plus its HeroUI separator's own props, which pass through unchanged.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0165.
 */
import type { Orientation } from "#contracts/enums/orientation.enum";
import type { SeparatorVariant } from "#contracts/enums/separator-variant.enum";

/** Props shared by the web and native `Separator`. */
export interface SeparatorContractProps {
  /** The axis of the rule; a vertical one stretches to its row's height. Defaults to `horizontal`. */
  readonly orientation?: Orientation | undefined;
  /** The colour level, matching the surface the rule sits on. Defaults to `default`. */
  readonly variant?: SeparatorVariant | undefined;
}
