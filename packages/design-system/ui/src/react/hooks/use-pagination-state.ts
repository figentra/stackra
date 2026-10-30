/**
 * Stackra file contract:
 * Purpose: `usePaginationState(props)`, the state every runtime's Pagination shares: the page and page size
 *          (controlled or not), the page count, the shown range and the moves, each clamped to the pages there are.
 * Boundary: a React hook with no rendering; the runtimes draw the buttons, the size choice and the jump.
 * Runtime: isomorphic (the web and native Pagination both use it)
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave A, owner request 2026-10-29).
 */
import { useState } from "react";

import type { PaginationContractProps } from "#contracts/types/pagination-contract-props.type";

/** The shared pagination state. */
export function usePaginationState({
  total,
  page,
  defaultPage = 1,
  onPageChange,
  pageSize,
  defaultPageSize,
  onPageSizeChange,
  pageSizes,
}: PaginationContractProps): {
  readonly current: number;
  readonly size: number;
  readonly pageCount: number;
  readonly from: number;
  readonly to: number;
  readonly go: (next: number) => void;
  readonly resize: (next: number) => void;
} {
  const [ownPage, setOwnPage] = useState(defaultPage);
  const [ownSize, setOwnSize] = useState(defaultPageSize ?? pageSizes?.[0] ?? 10);
  const size = Math.max(1, pageSize ?? ownSize);
  const pageCount = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, page ?? ownPage), pageCount);
  const go = (next: number) => {
    const clamped = Math.min(Math.max(1, Math.round(next)), pageCount);
    if (clamped === current) return;
    if (page === undefined) setOwnPage(clamped);
    onPageChange?.(clamped);
  };
  const resize = (next: number) => {
    if (pageSize === undefined) setOwnSize(next);
    onPageSizeChange?.(next);
    if (page === undefined) setOwnPage(1);
    if (current !== 1) onPageChange?.(1);
  };
  const from = total === 0 ? 0 : (current - 1) * size + 1;
  const to = Math.min(total, current * size);
  return { current, size, pageCount, from, to, go, resize };
}
