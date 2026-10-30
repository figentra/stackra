/**
 * Stackra file contract:
 * Purpose: `MenubarProps`, the props of the web `Menubar`: the contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave D).
 */
import type { MenubarContractProps } from "#contracts/types/menubar-contract-props.type";

/** Props of the web Menubar. */
export type MenubarProps = MenubarContractProps & {
  /** Styles the bar. */
  readonly className?: string | undefined;
};
