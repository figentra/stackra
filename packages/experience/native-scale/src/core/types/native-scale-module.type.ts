/**
 * Stackra file contract:
 * Purpose: `NativeScaleModule`, the `StackraNativeScale` Expo module the drivers call: open and close one link, ask
 *          whether it is open, write a command as text, and the `onData` event with each chunk of text the scale sent.
 * Boundary: a type only. The Swift (`ios/`) and Kotlin (`android/`) sides are byte pipes: they do no framing, no
 *           parsing and no mapping (ADR 0478 decision 5). A failed `connect` rejects with code `E_PERMISSION` when a
 *           Bluetooth or USB permission is missing and `E_UNAVAILABLE` otherwise; the driver maps both to refusals.
 *           Text crosses as Latin-1, one character per byte, because scale protocols are ASCII.
 * Runtime: isomorphic
 * Governing contract: ADR 0478 (decisions 2 and 5).
 */
import type { ScaleLink } from "#core/types/scale-link.type";

/** The native scale module. */
export interface NativeScaleModule {
  /** Opens the link (closing any other first); rejects when the scale cannot be reached. */
  connect: (link: ScaleLink) => Promise<void>;
  /** Closes the link; resolves when there is none. */
  disconnect: () => Promise<void>;
  /** Whether a link is open now. */
  isConnected: () => Promise<boolean>;
  /** Writes `text` to the open link; rejects when none is open. */
  write: (text: string) => Promise<void>;
  /** Calls `listener` with each chunk the scale sends; `remove` on the answer stops it. */
  addListener: (
    eventName: "onData",
    listener: (event: { readonly text?: unknown }) => void,
  ) => { remove: () => void };
}
