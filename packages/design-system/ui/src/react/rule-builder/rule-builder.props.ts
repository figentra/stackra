/**
 * Stackra file contract:
 * Purpose: `RuleBuilderProps`, the props of the web `RuleBuilder`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { RuleBuilderContractProps } from "#contracts/types/rule-builder-contract-props.type";

/** Props of the web RuleBuilder. */
export type RuleBuilderProps = RuleBuilderContractProps & {
  readonly className?: string | undefined;
};
