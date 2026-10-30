/**
 * Stackra file contract:
 * Purpose: `ItemCardProps`, the props of the web `ItemCard`.
 * Boundary: types only; each contract plus the class name.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0305.
 */
import type { ItemCardContractProps } from "#contracts/types/item-card-contract-props.type";

/** Props of the web ItemCard. */
export type ItemCardProps = ItemCardContractProps & {
  /** Styles the card. */
  readonly className?: string | undefined;
};
