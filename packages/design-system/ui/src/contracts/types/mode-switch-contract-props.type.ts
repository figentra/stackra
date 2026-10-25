/**
 * Stackra file contract:
 * Purpose: the props every runtime's `ModeSwitch` takes: the per-user toggle between the normal and the developer
 *          display mode, controlled or not, with its label and help text.
 * Boundary: types only. The switch is offered only to holders of the developer-mode permission; that check is the
 *           caller's. Switching never changes what the viewer may do.
 * Runtime: isomorphic
 * Governing contract: ADR 0359 (decisions 1 and 2); ADR 0302 (decision 3).
 */
import type { ReactNode } from "react";

import type { DisplayMode } from "#contracts/enums/display-mode.enum";

/** Props shared by the web and native `ModeSwitch`. */
export interface ModeSwitchContractProps {
  /** The visible label (`Developer mode`); it is the switch's accessible name. */
  readonly label: ReactNode;
  /** Help text under the switch. */
  readonly description?: ReactNode | undefined;
  /** The current mode, for a controlled switch; pair it with `onModeChange`. */
  readonly mode?: DisplayMode | undefined;
  /** The starting mode, for an uncontrolled switch; `normal` when left out. */
  readonly defaultMode?: DisplayMode | undefined;
  /** Called with the new mode each time the viewer switches. */
  readonly onModeChange?: ((mode: DisplayMode) => void) | undefined;
  /** True to refuse switching. */
  readonly isDisabled?: boolean | undefined;
}
