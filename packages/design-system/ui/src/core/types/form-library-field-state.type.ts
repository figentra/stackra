/**
 * Stackra file contract:
 * Purpose: `FormLibraryFieldState`: the slice of react-hook-form's `fieldState` that the binding reads.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0055 (forms: the react-hook-form adapter).
 */
/** The slice of react-hook-form's `fieldState` that the binding reads. */
export interface FormLibraryFieldState {
  /** True while the field fails validation. */
  readonly invalid: boolean;
  /** The failure, with the message to show. */
  readonly error?: { readonly message?: string | undefined } | undefined;
}
