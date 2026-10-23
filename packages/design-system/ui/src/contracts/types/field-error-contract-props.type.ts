/**
 * Stackra file contract:
 * Purpose: the props every runtime's `FieldError` takes: the message that says what is wrong with a field, and
 *          whether the field is invalid. Each runtime's `FieldErrorProps` is this plus its HeroUI field error's own
 *          props, which pass through unchanged.
 * Boundary: types only. The message is plain content here; a function of the validation state is a web-only HeroUI
 *          feature and is left out so both runtimes take the same children.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0055 (forms); ADR 0165.
 */
import type { ReactNode } from "react";

/** Props shared by the web and native `FieldError`. */
export interface FieldErrorContractProps {
  /** The message; with none, the web error shows the field's own validation messages. */
  readonly children?: ReactNode;
  /**
   * True to show the error, false to hide it. Left out, the error follows the field it sits in; a form adapter that
   * keeps its own validation state sets it.
   */
  readonly isInvalid?: boolean | undefined;
}
