/**
 * Stackra file contract:
 * Purpose: `FooterProps`, the props of the web `Footer`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import type { FooterContractProps } from "#contracts/types/footer-contract-props.type";

/** Props of the web Footer. */
export type FooterProps = FooterContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
