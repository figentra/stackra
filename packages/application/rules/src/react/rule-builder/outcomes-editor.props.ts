/**
 * Stackra file contract:
 * Purpose: `OutcomesEditorProps`, what the builder's outcome list takes: the consumer's `Rules`, the outcomes it
 *          edits, their problems by path and where each change goes.
 * Boundary: a type only; internal to the `./react` entry.
 * Runtime: react
 * Governing contract: ADR 0305 (props in `<name>.props.ts`); ADR 0331 (decisions 8 and 9).
 */
import type { FieldErrors } from "@stackra/errors";

import type { Outcome, Rules } from "#core/index";

/** The props of the outcome list. */
export interface OutcomesEditorProps {
  /** The consumer's registry: the list offers its outcome kinds and their parameters only. */
  readonly rules: Rules;

  /** The outcomes shown, in the order the consumer applies them. */
  readonly outcomes: readonly Outcome[];

  /** The problems of the outcomes, by path (`0`, `0.params.days`, `(root)`). */
  readonly problems: FieldErrors;

  /** True to show the outcomes without letting them change. */
  readonly isReadOnly: boolean;

  /** Called with the whole changed list. */
  readonly onChange: (next: readonly Outcome[]) => void;
}
