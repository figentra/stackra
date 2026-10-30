/**
 * Stackra file contract:
 * Purpose: `ScrollAreaProps`, the props of the web `ScrollArea`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { ScrollAreaContractProps } from "#contracts/types/scroll-area-contract-props.type";

/** Props of the web ScrollArea. */
export type ScrollAreaProps = ScrollAreaContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
