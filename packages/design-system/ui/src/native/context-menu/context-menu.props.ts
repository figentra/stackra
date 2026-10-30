/**
 * Stackra file contract:
 * Purpose: `ContextMenuProps`, the props of the native `ContextMenu`: the shared contract and a class name for the
 *          area.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave C).
 */
import type { ContextMenuContractProps } from "#contracts/types/context-menu-contract-props.type";

/** Props of the native ContextMenu. */
export type ContextMenuProps = ContextMenuContractProps & {
  /** Styles the area. */
  readonly className?: string | undefined;
};
