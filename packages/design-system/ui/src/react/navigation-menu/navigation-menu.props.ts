/**
 * Stackra file contract:
 * Purpose: `NavigationMenuProps`, the props of the web `NavigationMenu`: the contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave C).
 */
import type { NavigationMenuContractProps } from "#contracts/types/navigation-menu-contract-props.type";

/** Props of the web NavigationMenu. */
export type NavigationMenuProps = NavigationMenuContractProps & {
  /** Styles the `nav`. */
  readonly className?: string | undefined;
};
