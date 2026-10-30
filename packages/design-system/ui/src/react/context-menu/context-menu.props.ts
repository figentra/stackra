/**
 * Stackra file contract:
 * Purpose: `ContextMenuProps`, the props of the web `ContextMenu`: the contract and a class name for the area.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); STA-1371.
 */
import type { ContextMenuContractProps } from "#contracts/types/context-menu-contract-props.type";

/** Props of the web ContextMenu. */
export type ContextMenuProps = ContextMenuContractProps & {
  readonly className?: string | undefined;
};
