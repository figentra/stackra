/**
 * Stackra file contract:
 * Purpose: `ConditionEditorProps`, what the builder's node editor takes: the node, its path, the tree's problems and
 *          where a change or a removal goes.
 * Boundary: a type only; internal to the `./react` entry.
 * Runtime: react
 * Governing contract: ADR 0305 (props in `<name>.props.ts`); ADR 0331 (decision 8).
 */
import type { FieldErrors } from "@stackra/errors";

import type { Condition, Rules } from "#core/index";

/** The props of one node's editor. */
export interface ConditionEditorProps {
  /** The consumer's registry. */
  readonly rules: Rules;

  /** The node shown. */
  readonly node: Condition;

  /** The node's path from the root (`""`, `all.0`). */
  readonly path: string;

  /** The whole tree's problems, by path. */
  readonly problems: FieldErrors;

  /** True to show the node without letting it change. */
  readonly isReadOnly: boolean;

  /** Called with the changed node. */
  readonly onChange: (next: Condition) => void;

  /** Removes the node from its group; left out for the root. */
  readonly onRemove?: (() => void) | undefined;
}
