/**
 * Stackra file contract:
 * Purpose: `ReasoningProps`, the props of the web `Reasoning`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { ReasoningContractProps } from "#contracts/types/reasoning-contract-props.type";

/** Props of the web Reasoning. */
export type ReasoningProps = ReasoningContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
