/**
 * Stackra file contract:
 * Purpose: the `BumpBar` port: the kitchen display's bump bar, a keyboard-wedge or HID keypad. A listener receives each
 *          key as a `BumpBarKey` until it unsubscribes.
 * Boundary: an abstract class that is its own token, keyed `peripherals.BumpBar`. The driver maps device keys to
 *           `BumpBarKey`; what a bump does to a ticket is the kitchen display's.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decisions 1 and 4); ADR 0250 (decision 3); ADR 0294 (decisions 4, 15 and 16).
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

import type { BumpBarKey } from "#contracts/enums/bump-bar-key.enum";

/**
 * The bump bar.
 *
 * @example
 * const stop = bumpBar.onKey((key) => (key === BumpBarKey.Bump ? board.bumpSelected() : board.move(key)));
 */
export abstract class BumpBar extends Port {
  /** Type-only port key, so `DriverName<BumpBar>` narrows to this port's drivers. */
  declare readonly "~key": "peripherals.BumpBar";

  /** Whether the bump bar can be listened to now. */
  abstract probe(): Promise<CapabilityResult>;

  /** Calls `listener` with each key pressed; the returned function stops it. */
  abstract onKey(listener: (key: BumpBarKey) => void): () => void;
}
