/**
 * Stackra file contract:
 * Purpose: the props of the `LiveTableMap`: the floor plan's grid and items, each table's live state, the zoom, and
 *          the handler a pressed table reports to.
 * Boundary: types only. The map shows, never changes, the plan; a table without a live state is drawn without one.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3).
 */
import type { FloorItem } from "#contracts/types/floor-item.type";
import type { LiveTable } from "#contracts/types/live-table.type";

/** Props of the `LiveTableMap`. */
export interface LiveTableMapContractProps {
  /** The map's name for screen readers (`Main hall`). */
  readonly label: string;
  /** The plan's width, in cells. */
  readonly columns: number;
  /** The plan's height, in cells. */
  readonly rows: number;
  /** The size of one cell in pixels (points on native): the zoom. */
  readonly cellSize?: number | undefined;
  /** The tables, walls and labels of the plan. */
  readonly items: readonly FloorItem[];
  /** The live state of each table, by its item id. */
  readonly tables: readonly LiveTable[];
  /** Called with the id of the table pressed. */
  readonly onTablePress?: ((id: string) => void) | undefined;
}
