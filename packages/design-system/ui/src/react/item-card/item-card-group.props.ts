/**
 * Stackra file contract:
 * Purpose: `ItemCardGroupProps`, the props of the web `ItemCardGroup`.
 * Boundary: types only; the contract plus the class name.
 * Runtime: browser
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0305 (rules 10 to 13).
 */
import type { ItemCardGroupContractProps } from "#contracts/types/item-card-group-contract-props.type";

/** Props of the web ItemCardGroup. */
export type ItemCardGroupProps = ItemCardGroupContractProps & {
  /** Styles the group. */
  readonly className?: string | undefined;
};
