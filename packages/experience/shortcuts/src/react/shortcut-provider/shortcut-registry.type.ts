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

/** The registry. */
export interface ShortcutRegistry {
  readonly config: () => ShortcutRegistryConfig;
  readonly register: (registration: ShortcutRegistration) => () => void;
  readonly pushOverlay: (id: number) => () => void;
  readonly list: () => readonly RegisteredShortcut[];
  readonly subscribe: (listener: () => void) => () => void;
  readonly run: (id: string) => boolean;
  readonly keyDown: (press: ShortcutKeyPress, now: number) => boolean;
  readonly keyUp: (key: string) => void;
  readonly reset: () => void;
  readonly isRevealed: () => boolean;
  readonly hasKeyboard: () => boolean;
  readonly subscribeView: (listener: () => void) => () => void;
}
