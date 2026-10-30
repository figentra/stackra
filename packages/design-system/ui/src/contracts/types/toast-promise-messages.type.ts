/**
 * Stackra file contract:
 * Purpose: `ToastPromiseMessages`, what `toast.promise(work, messages)` says while the work runs and once it settles:
 *          one toast that changes in place from loading to success or to failure.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0312; WCAG 2.2 SC 4.1.3; STA-1371 (owner request 2026-10-29).
 */

/** The words of a promise toast. */
export interface ToastPromiseMessages<T> {
  /** Shown with a spinner while the work runs, for example "Saving the order…". */
  readonly loading: string;
  /** Shown in the success tone when it resolves; a function gets the resolved value. */
  readonly success: string | ((value: T) => string);
  /** Shown in the danger tone when it rejects; a function gets the reason. */
  readonly error: string | ((reason: unknown) => string);
  /** A second line under the settled message. */
  readonly description?: string | undefined;
}
