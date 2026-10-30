/**
 * Stackra file contract:
 * Purpose: `ShareButtonProps`, the props of the web `ShareButton`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { ShareButtonContractProps } from "#contracts/types/share-button-contract-props.type";

/** Props of the web ShareButton. */
export type ShareButtonProps = ShareButtonContractProps & {
  /** Styles the button. */
  readonly className?: string | undefined;
};
