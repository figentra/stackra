/**
 * Stackra file contract:
 * Purpose: `liveRows(view)`, the row state of a live view: `update(name, patch)` changes a row or adds one, `rows()`
 *          reads them, and `settled()` gives the final checklist rows, a row still pending or running as skipped.
 * Boundary: pure state; every Renderer driver's `live` keeps its rows here, so they settle the same way.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-004.
 */
import type { CheckRow } from "#contracts/types/check-row.type";
import type { LiveRow } from "#contracts/types/live-row.type";
import type { LiveView } from "#contracts/types/live-view.type";

/** The rows of a live view and how they change. */
export function liveRows(view: LiveView): {
  readonly update: (name: string, patch: Partial<LiveRow>) => void;
  readonly rows: () => readonly LiveRow[];
  readonly settled: () => readonly CheckRow[];
} {
  let rows: LiveRow[] = [...view.rows];
  return {
    update: (name, patch) => {
      rows = rows.some((row) => row.name === name)
        ? rows.map((row) => (row.name === name ? { ...row, ...patch, name } : row))
        : [...rows, { status: "pending", ...patch, name }];
    },
    rows: () => rows,
    settled: () =>
      rows.map((row) =>
        row.status === "pending" || row.status === "running"
          ? { ...row, status: "skip" }
          : (row as CheckRow),
      ),
  };
}
