/**
 * Stackra file contract:
 * Purpose: `FormLibraryField`: the slice of react-hook-form's `field` that the binding reads.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0055 (forms: the react-hook-form adapter).
 */
/** The slice of react-hook-form's `field` that the binding reads. */
export interface FormLibraryField<TValue> {
  /** The field's path in the form. */
  readonly name: string;
  /** The value the form holds. */
  readonly value: TValue;
  /** Stores a new value; react-hook-form's accepts a value or an event, and the design system passes the value. */
  readonly onChange: (value: TValue) => void;
  /** Marks the field touched. */
  readonly onBlur: () => void;
  /** True while the form disables the field. */
  readonly disabled?: boolean | undefined;
}
