/**
 * Stackra file contract:
 * Purpose: `RuleBuilderProps`, the props of the native `RuleBuilder`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; STA-1371.
 */
import type { RuleBuilderContractProps } from "#contracts/types/rule-builder-contract-props.type";

/** Props of the native RuleBuilder. */
export type RuleBuilderProps = RuleBuilderContractProps & {
  readonly className?: string | undefined;
};
