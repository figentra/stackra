/**
 * Stackra file contract:
 * Purpose: `RuleBuilderProps`, what `RuleBuilder` takes: the consumer's `Rules`, the condition it edits and where each
 *          change goes, and, for a consumer with outcome kinds, the outcomes a match yields, where their changes go
 *          and the market floors a save will be refused against.
 * Boundary: a type only. The builder is controlled: it holds no condition or outcome of its own and reports every
 *           change. The outcome list shows only when `onOutcomesChange` is given.
 * Runtime: browser
 * Governing contract: ADR 0305 (props in `<name>.props.ts`); ADR 0331 (decisions 8 and 9); config-model section 4.
 */
import type { ResolvedValue } from "@stackra/market-packs";

import type { Condition, Outcome, Rules } from "#core/index";

/** The props of the rule builder. */
export interface RuleBuilderProps {
  /** The consumer's registry: the builder offers its fields and their types' operators only. */
  readonly rules: Rules;

  /** The condition shown; start a new rule with `{ all: [] }`. */
  readonly value: Condition;

  /** Called with the whole changed condition, which may still have problems until the user completes it. */
  readonly onChange: (next: Condition) => void;

  /** The outcomes shown; none when left out. */
  readonly outcomes?: readonly Outcome[] | undefined;

  /** Called with the whole changed outcome list; the list is shown only when this is given. */
  readonly onOutcomesChange?: ((next: readonly Outcome[]) => void) | undefined;

  /** The legal floors of the tenant's market, so a value past one is marked before the save refuses it. */
  readonly floors?: readonly ResolvedValue[] | undefined;

  /** True to show the rule without letting it change. */
  readonly isReadOnly?: boolean | undefined;
}
