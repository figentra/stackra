/**
 * Stackra file contract:
 * Purpose: `RuleBuilderProps`, what `RuleBuilder` takes: the consumer's `Rules`, the condition it edits and where each
 *          change goes.
 * Boundary: a type only. The builder is controlled: it holds no condition of its own and reports every change.
 * Runtime: react
 * Governing contract: ADR 0305 (props in `<name>.props.ts`); ADR 0331 (decision 8).
 */
import type { Condition, Rules } from "#core/index";

/** The props of the rule builder. */
export interface RuleBuilderProps {
  /** The consumer's registry: the builder offers its fields and their types' operators only. */
  readonly rules: Rules;

  /** The condition shown; start a new rule with `{ all: [] }`. */
  readonly value: Condition;

  /** Called with the whole changed condition, which may still have problems until the user completes it. */
  readonly onChange: (next: Condition) => void;

  /** True to show the condition without letting it change. */
  readonly isReadOnly?: boolean | undefined;
}
