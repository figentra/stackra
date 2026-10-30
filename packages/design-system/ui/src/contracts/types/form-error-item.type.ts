/**
 * Stackra file contract:
 * Purpose: `FormErrorItem`, one entry of a `FormErrorSummary`: the field it belongs to and what is wrong.
 * Boundary: types only. `field` is the input's id (web; its `name` is tried next) or the key the native caller focuses.
 * Runtime: isomorphic
 * Governing contract: ADR 0055 (forms); ADR 0305 (one declaration per file); WCAG 2.2 SC 3.3.1; STA-1371.
 */

/** One error of a form. */
export interface FormErrorItem {
  /** The field's id (web) or key (native). */
  readonly field: string;
  /** What is wrong and how to fix it, such as "Enter an email address". */
  readonly message: string;
  /** The field's name, written before the message ("Email: Enter an email address"); left out, the message alone. */
  readonly label?: string | undefined;
}
