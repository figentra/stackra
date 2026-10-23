/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Form` takes: the fields and the button that submit together. Each runtime's
 *          `FormProps` is this plus its own: web adds HeroUI's form props (`onSubmit`, `validationErrors`) and
 *          `isSubmitOnModEnter`; native takes the props of a `View`.
 * Boundary: types only. A native screen submits by a button the user presses, so the contract has no submit prop:
 *          the handler is the button's.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0055 (forms); ADR 0165.
 */
import type { ReactNode } from "react";

/** Props shared by the web and native `Form`. */
export interface FormContractProps {
  /** The fields and the submit button. */
  readonly children?: ReactNode;
}
