/**
 * Stackra file contract:
 * Purpose: `RuleBuilderContractProps`, the props of every runtime's `RuleBuilder`: an "all / any of these" sentence of
 *          conditions the user adds, edits and removes.
 * Boundary: types only. Controlled: the rule is the caller's.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import type { RuleField } from "#contracts/types/rule-field.type";
import type { RuleGroup } from "#contracts/types/rule-group.type";

/** Props shared by the web and native `RuleBuilder`. */
export interface RuleBuilderContractProps {
  readonly fields: readonly RuleField[];
  readonly value: RuleGroup;
  readonly onChange: (value: RuleGroup) => void;
  /** The builder's accessible name, such as "Discount applies when". */
  readonly label: string;
  readonly isDisabled?: boolean | undefined;
}
