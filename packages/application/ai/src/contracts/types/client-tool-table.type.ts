/**
 * Stackra file contract:
 * Purpose: `ClientToolTable`, an app's client tools: the app member's key, a hash of the rows, and the rows.
 * Boundary: a type only; the union of the client tools of every module the app mounts (ADR 0490 decision 16),
 *           written by gen as `#stackra/client-tools`. The hash travels on the surface descriptor, so a surface that
 *           holds an older table than the server is offered no client tool (decision 3).
 * Runtime: isomorphic
 * Governing contract: ADR 0490 (decisions 1, 3 and 16); STA-1631.
 */
import type { ClientToolRow } from "#contracts/types/client-tool-row.type";

/** An app's client tool table. */
export interface ClientToolTable {
  /** The app member's key. */
  readonly app: string;

  /** A hash of the rows, equal for equal tables. */
  readonly hash: string;

  /** The tools, sorted by key. */
  readonly tools: readonly ClientToolRow[];
}
