/**
 * Stackra file contract:
 * Purpose: `ShortcutRegistry`, what `createShortcutRegistry` builds and the nearest `ShortcutProvider` shares: registration, the overlay stack, the list, the runner, key handling and the reveal.
 * Boundary: a type only; internal to `./react`: apps use the hooks.
 * Runtime: browser
 * Governing contract: ADR 0508.
 */
import type { RegisteredShortcut } from "#react/shortcut-provider/registered-shortcut.type";
import type { ShortcutKeyPress } from "#react/shortcut-provider/shortcut-key-press.type";
import type { ShortcutRegistration } from "#react/shortcut-provider/shortcut-registration.type";
import type { ShortcutRegistryConfig } from "#react/shortcut-provider/shortcut-registry-config.type";

/** The runtime registry of the actions a provider listens for. */
export interface ShortcutRegistry {
  /** Reads the live settings, platform, direction and permission check. */
  readonly config: () => ShortcutRegistryConfig;
  /** Registers an action and returns the call that removes it. */
  readonly register: (registration: ShortcutRegistration) => () => void;
  /** Opens an overlay scope and returns the call that closes it. */
  readonly pushOverlay: (id: number) => () => void;
  /** Lists the actions that are active and allowed now. */
  readonly list: () => readonly RegisteredShortcut[];
  /** Calls `listener` when the list changes; returns the unsubscribe. */
  readonly subscribe: (listener: () => void) => () => void;
  /** Runs the action `id`; false when none answers. */
  readonly run: (id: string) => boolean;
  /** Matches a key press to an action and runs it; true when the press was consumed. */
  readonly keyDown: (press: ShortcutKeyPress, now: number) => boolean;
  /** Handles a key release; letting go of Mod cancels the reveal. */
  readonly keyUp: (key: string) => void;
  /** Drops a pending two-key sequence and cancels the reveal. */
  readonly reset: () => void;
  /** True while holding Mod shows the bindings. */
  readonly isRevealed: () => boolean;
  /** True once a key press shows the person has a keyboard. */
  readonly hasKeyboard: () => boolean;
  /** Calls `listener` when the reveal or keyboard state changes; returns the unsubscribe. */
  readonly subscribeView: (listener: () => void) => () => void;
}
