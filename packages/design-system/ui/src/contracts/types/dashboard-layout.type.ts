/**
 * Stackra file contract:
 * Purpose: `DashboardLayout`, the tiles of a `DashboardGrid` in reading order, each with its size.
 * Boundary: types only; plain data, saved and loaded through a `DashboardLayoutPort`.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (decision 18); ADR 0305 (one declaration per file); STA-1371.
 */
import type { DashboardTile } from "#contracts/types/dashboard-tile.type";

/** A dashboard's tiles, in reading order. */
export type DashboardLayout = readonly DashboardTile[];
