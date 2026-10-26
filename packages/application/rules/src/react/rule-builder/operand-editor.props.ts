/**
 * Stackra file contract:
 * Purpose: `OperandEditorProps`, what the builder's value editor takes: the leaf's field and operator, its value, and
 *          where a changed value goes.
 * Boundary: a type only; internal to the `./react` entry.
 * Runtime: browser
 * Governing contract: ADR 0305 (props in `<name>.props.ts`); ADR 0331 (decisions 3 and 8).
 */
import type { Json } from "@stackra/contracts";
import type { I18nKey } from "@stackra/i18n";
import type { ReactNode } from "react";

import type { FactField, Operator } from "#contracts/index";

/** The props of a leaf's value editor. */
export interface OperandEditorProps {
  /** The leaf's field. */
  readonly field: FactField;

  /** The leaf's operator, which fixes the value's shape. */
  readonly operator: Operator;

  /** The leaf's value; left out for none yet. */
  readonly value: Json | undefined;

  /** True to show the value without letting it change. */
  readonly isReadOnly: boolean;

  /** The label of a one-value or list field in place of "Value" (an outcome parameter's name). */
  readonly label?: I18nKey;

  /** The message of a value the check refused. */
  readonly errorMessage?: ReactNode;

  /** Called with the value the user's text reads as; text that reads as nothing valid is passed on as written. */
  readonly onChange: (value: Json | undefined) => void;
}
