/**
 * Stackra file contract:
 * Purpose: `ErrorPageProps`, the props of the web `ErrorPage` in `error-page.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); GAPS.md row 31
 *          (owner decision 2026-10-28).
 */
import type { ErrorPageContractProps } from "#contracts/types/error-page-contract-props.type";
import type { ErrorStateProps } from "#react/error-state/error-state.props";

/**
 * Props of the web ErrorPage: the shared contract plus the attributes of ErrorState's root, passed through. The
 * kind and the retry are the preset's.
 */
export type ErrorPageProps = ErrorPageContractProps &
  Omit<ErrorStateProps, keyof ErrorPageContractProps | "kind" | "retry">;
