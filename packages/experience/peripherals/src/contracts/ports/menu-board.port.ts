/**
 * Stackra file contract:
 * Purpose: the `MenuBoard` port: menu-board and drive-through displays. It shows a view on a named screen and clears
 *          it, each as a `CapabilityResult` that refuses with capability `window` when the screen is not there.
 * Boundary: an abstract class that is its own token, keyed `peripherals.MenuBoard`. The screen is a window, a browser
 *           on a TV or a device; the driver only delivers views to it.
 * Runtime: isomorphic
 * Governing contract: ADR 0339 (decision 1); ADR 0250 (decision 3); ADR 0294 (decisions 15 and 16).
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

import type { MenuBoardView } from "#contracts/types/menu-board-view.type";

/**
 * The menu-board screens.
 *
 * @example
 * await boards.show({ screen: "wall_left", sections, message: null });
 */
export abstract class MenuBoard extends Port {
  /** Type-only port key, so `DriverName<MenuBoard>` narrows to this port's drivers. */
  declare readonly "~key": "peripherals.MenuBoard";

  /** Whether views can be delivered to `screen` now. */
  abstract probe(screen: string): Promise<CapabilityResult>;

  /** Shows `view` on its screen, replacing the one before. */
  abstract show(view: MenuBoardView): Promise<CapabilityResult>;

  /** Clears `screen` (the idle screen). */
  abstract clear(screen: string): Promise<CapabilityResult>;
}
