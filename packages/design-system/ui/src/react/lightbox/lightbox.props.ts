/**
 * Stackra file contract:
 * Purpose: `LightboxProps`, the props of the web `Lightbox`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { LightboxContractProps } from "#contracts/types/lightbox-contract-props.type";

/** Props of the web Lightbox. */
export type LightboxProps = LightboxContractProps & {
  /** Styles the dialog. */
  readonly className?: string | undefined;
};
