/**
 * Stackra file contract:
 * Purpose: `SpotlightNativeModule`, the JavaScript face of the `StackraSpotlight` Expo module (`ios/`, `android/`):
 *          index, remove and clear entries, and the opened-entry link with its `onOpen` event.
 * Boundary: a type only; the module is a pass-through and the driver maps the port onto it. `addListener` is
 *           declared here, as expo's `NativeModule` type is the module's class, not an instance. `takeOpened` and
 *           `onOpen` are iOS only; Android opens an entry as an ordinary deep link through `Linking`.
 * Runtime: react-native
 * Governing contract: ADR 0478 (decisions 2 and 5: the module stays a pass-through).
 */
import type { SpotlightNativeItem } from "#native/types/spotlight-native-item.type";

/** The `StackraSpotlight` native module. */
export interface SpotlightNativeModule {
  /** Whether the OS offers an index to this app now. */
  isAvailable: () => boolean;
  /** Adds or replaces entries by link. */
  index: (items: SpotlightNativeItem[]) => Promise<void>;
  /** Removes entries by link. */
  remove: (urls: string[]) => Promise<void>;
  /** Removes every entry this app added. */
  removeAll: () => Promise<void>;
  /** The link of the entry that opened the app before anyone listened, once; null when none. */
  takeOpened: () => string | null;
  /** Calls `listener` each time an entry is opened from the system search while the app listens (iOS). */
  addListener: (
    eventName: "onOpen",
    listener: (event: { url: string }) => void,
  ) => { remove: () => void };
}
