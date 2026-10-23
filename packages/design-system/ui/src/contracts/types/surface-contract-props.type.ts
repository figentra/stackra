/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Surface` takes: its content and its surface level. Each runtime's
 *          `SurfaceProps` is this plus its HeroUI surface's own props, which pass through unchanged.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7); ADR 0304; ADR 0165.
 */
import type { ReactNode } from "react";

import type { SurfaceVariant } from "#contracts/enums/surface-variant.enum";

/** Props shared by the web and native `Surface`. */
export interface SurfaceContractProps {
  /** The content painted on the surface; HeroUI components inside read the level and pick on-surface colours. */
  readonly children: ReactNode;
  /** The surface level, from the theme's surface roles. Defaults to `default`. */
  readonly variant?: SurfaceVariant | undefined;
}
