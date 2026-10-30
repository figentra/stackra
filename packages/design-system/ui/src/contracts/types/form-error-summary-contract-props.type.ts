/**
 * Stackra file contract:
 * Purpose: `FormErrorSummaryContractProps`, the props of every runtime's `FormErrorSummary`: the box shown above a form
 *          after a failed submit, listing each error as a link to its field.
 * Boundary: types only. Nothing is drawn while there are no errors. Focus (web) or an announcement (native) goes to the
 *           summary when it appears and each time `submitCount` changes, never while the reader types.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0055 (forms); WCAG 2.2 SC 2.4.3, 3.3.1
 *          and 3.3.3; STA-1371.
 */
import type { FormErrorItem } from "#contracts/types/form-error-item.type";

/** Props shared by the web and native `FormErrorSummary`. */
export interface FormErrorSummaryContractProps {
  /**
   * The errors, in the form's order. Left out on the web inside a schema `Form`, the form's own field errors are listed.
   */
  readonly errors?: readonly FormErrorItem[] | undefined;
  /** The heading; "There are 3 problems" in the reader's language by default. */
  readonly title?: string | undefined;
  /** Bump it after each failed submit to move focus to the summary again (a schema form's own count is read). */
  readonly submitCount?: number | undefined;
  /** Called with the field's id after its link is followed (web), or instead of following it (native). */
  readonly onSelectError?: ((field: string) => void) | undefined;
}
