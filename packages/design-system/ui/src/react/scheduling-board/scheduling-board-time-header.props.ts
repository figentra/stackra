/**
 * Stackra file contract:
 * Purpose: `SchedulingBoardTimeHeaderProps`, the props of the web SchedulingBoard's column headers: the shared state
 *          and each column's leading edge.
 * Boundary: types only; internal.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); shared modules step 4a (LEADER, 2026-11-09).
 */
import type { SchedulingBoardState } from "#core/types/scheduling-board-state.type";

/** Props of the column headers. */
export interface SchedulingBoardTimeHeaderProps {
  /** The shared state. */
  readonly state: SchedulingBoardState;
  /** Each column's leading edge: a day's border, an hour's lighter one (with its label), or none. */
  readonly edges: readonly ("day" | "hour" | "none")[];
}
