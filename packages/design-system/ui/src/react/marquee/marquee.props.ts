/**
 * Stackra file contract:
 * Purpose: `MarqueeProps`, the props of the web `Marquee`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import type { MarqueeContractProps } from "#contracts/types/marquee-contract-props.type";

/** Props of the web Marquee. */
export type MarqueeProps = MarqueeContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
