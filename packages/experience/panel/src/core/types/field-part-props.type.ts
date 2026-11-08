/**
 * Stackra file contract:
 * Purpose: `FieldPartProps`, what every drawn part of a resource form field takes: the form path it binds and its label.
 * Boundary: a type only; the web and native `ResourceFormField` parts share it.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (form keys are paths of the input); ADR 0055 (thin field adapters).
 */

/** The binding path and label of a form field part. */
export interface FieldPartProps {
  /** The form path the part binds (`parcels.0.weight`). */
  readonly name: string;

  /** The part's label. */
  readonly label: string;
}
