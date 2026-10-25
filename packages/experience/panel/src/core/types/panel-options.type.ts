/**
 * Stackra file contract:
 * Purpose: `PanelOptions`, what `Panel({ ... })` takes: where the app mounts the panel and the area it hosts.
 * Boundary: a type only; the key is derived from the file.
 * Runtime: isomorphic
 * Governing contract: ADR 0164 (decision 3: several panels); ADR 0082 (API areas).
 */
import type { ApiArea } from "@stackra/contracts";

/** The options of a panel. */
export interface PanelOptions {
  /** The mount path (`/`, `/portal`). */
  readonly path: string;

  /** The API area it hosts. */
  readonly area: ApiArea;
}
