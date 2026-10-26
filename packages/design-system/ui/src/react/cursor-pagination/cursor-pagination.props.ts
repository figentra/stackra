/**
 * Stackra file contract:
 * Purpose: `CursorPaginationProps`, the props of the web `CursorPagination` in `cursor-pagination.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0313 (decision 4); ADR 0060 (right-to-left); WCAG 2.2 SC 4.1.3.
 */
import type { ComponentPropsWithoutRef } from "react";
import type { CursorPaginationContractProps } from "#contracts/types/cursor-pagination-contract-props.type";

/**
 * Props of the web CursorPagination: the shared contract plus the `nav` element's own props, passed through. The
 * element's `aria-label` is the contract's `label`, so the type refuses it.
 */
export type CursorPaginationProps = CursorPaginationContractProps &
  Omit<
    ComponentPropsWithoutRef<"nav">,
    keyof CursorPaginationContractProps | "aria-label" | "children"
  >;
