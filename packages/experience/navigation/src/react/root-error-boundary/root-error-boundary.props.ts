/**
 * Stackra file contract:
 * Purpose: `RootErrorBoundaryProps`, the props of `RootErrorBoundary`: the route key its home link goes to, and the
 *          locale mount's prefix that link stays in.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`; rule 35).
 */

/** Props of `RootErrorBoundary`. */
export interface RootErrorBoundaryProps {
  /** The route key of the home link (`landing`); `/` when left out or not registered. */
  readonly home?: string | undefined;

  /** The locale mount's prefix (`/ar-sa`); the default mount's when left out. */
  readonly prefix?: string | undefined;
}
