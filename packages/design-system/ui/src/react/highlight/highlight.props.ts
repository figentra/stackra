/**
 * Stackra file contract:
 * Purpose: `HighlightProps`, the props of the web `Highlight`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { HighlightContractProps } from "#contracts/types/highlight-contract-props.type";

/** Props of the web Highlight. */
export type HighlightProps = HighlightContractProps & {
  /** Styles the text. */
  readonly className?: string | undefined;
};
