/**
 * Stackra file contract:
 * Purpose: `PanelRef`, one panel as the generated `#stackra/panels` names it (`Panels.Admin`): its derived key, its
 *          mount path and the API area it hosts.
 * Boundary: a type only; built by `panels({...})`. Packages and services name an area and never a panel.
 * Runtime: isomorphic
 * Governing contract: ADR 0164 (decision 3: several panels); ADR 0082 (API areas); ADR 0294 (decision 20).
 */
import type { ApiArea } from "@stackra/contracts";

/** The reference to one panel an app mounts. */
export interface PanelRef {
  /** The snake_case key derived from the panel file (`admin`). */
  readonly key: string;

  /** Where the app mounts it (`/`, `/portal`). */
  readonly path: string;

  /** The area whose resources, widgets, documents and settings it hosts. */
  readonly area: ApiArea;
}
