/**
 * Stackra file contract:
 * Purpose: `ColorSchemeService`, the one owner of the colour scheme a user chose: it reads and writes it in the
 *          device's `prefs` storage area, resolves `system` through the `SystemColorScheme` port, and notifies
 *          subscribers when the choice or the system preference changes. `useColorScheme()` reads it; a shortcut or a
 *          desktop menu injects it.
 * Boundary: a singleton service. The choice is read from `prefs` on every read, never cached, so a storage hydration
 *           that lands after the service was built is seen; a stored value that is not one of `ThemingConfig.schemes`
 *           reads as `defaultScheme`. The system preference is watched only while someone subscribes. Applying the
 *           scheme to the screen (`data-theme`, Uniwind, `Appearance`) is the design system provider's, which the
 *           generated root mounts with this service's scheme.
 * Runtime: isomorphic
 * Governing contract: ADR 0060 (light and dark); ADR 0079 (client state); ADR 0256 (decision 2: the prefs area); ADR
 *                     0294 (decisions 16 and 17).
 */
import { Service } from "@stackra/container";
import type { StorageAreaHandle } from "@stackra/storage/contracts";
import { Storage } from "@stackra/storage/contracts";
import type { ColorScheme } from "@stackra/ui/contracts";

import { ThemingConfig } from "#config/theming.config";
import { SystemColorScheme } from "#contracts/ports/system-color-scheme.port";
import type { ColorSchemeState } from "#core/types/color-scheme-state.type";

/** Where the choice is kept in the `prefs` area. */
const SCHEME_KEY = "theming.scheme";

/**
 * The chosen colour scheme, persisted per device.
 *
 * @example
 * export class CycleThemeShortcut extends Shortcut({ keys: "mod+shift+l" }) {
 *   constructor(private readonly theming: ThemingConfig, private readonly colorScheme: ColorSchemeService) { ... }
 * }
 * colorScheme.setScheme(ColorScheme.Dark);
 */
export class ColorSchemeService extends Service {
  private readonly config: ThemingConfig;

  private readonly prefs: StorageAreaHandle;

  private readonly system: SystemColorScheme;

  private readonly listeners = new Set<() => void>();

  private stopWatchingSystem: (() => void) | undefined;

  private current: ColorSchemeState;

  private readonly first: ColorSchemeState;

  /**
   * @param config - the schemes on offer and the first one.
   * @param storage - the client storage whose `prefs` area keeps the choice.
   * @param system - the system preference `system` resolves to.
   * @throws RangeError when `defaultScheme` is not one of `schemes`.
   */
  constructor(config: ThemingConfig, storage: Storage, system: SystemColorScheme) {
    super();
    if (!config.schemes.includes(config.defaultScheme))
      throw new RangeError(
        `ThemingConfig.defaultScheme "${config.defaultScheme}" is not one of its schemes (${config.schemes.join(", ")})`,
      );
    this.config = config;
    this.prefs = storage.prefs;
    this.system = system;
    this.current = this.read();
    const scheme = config.defaultScheme;
    this.first = Object.freeze({
      scheme,
      resolved: scheme === "system" ? "light" : scheme,
      setScheme: this.setScheme,
    });
  }

  /** The chosen scheme. */
  get scheme(): ColorScheme {
    return this.state().scheme;
  }

  /**
   * Chooses `scheme`, keeps it in `prefs` and notifies subscribers when what is on screen changes.
   *
   * @throws RangeError when `scheme` is not one of `ThemingConfig.schemes`; nothing is stored then.
   */
  readonly setScheme = (scheme: ColorScheme): void => {
    if (!this.config.schemes.includes(scheme))
      throw new RangeError(
        `"${scheme}" is not one of the schemes on offer (${this.config.schemes.join(", ")})`,
      );
    this.prefs.set(SCHEME_KEY, scheme);
    this.refresh();
  };

  /**
   * The current snapshot: the same object until the choice or the system preference changes, so it is the snapshot
   * `useSyncExternalStore` compares.
   */
  readonly state = (): ColorSchemeState => {
    this.sync();
    return this.current;
  };

  /**
   * What a server renders and a hydrating client starts from: the default scheme, with `system` shown as light,
   * because neither the device's choice nor its preference is known before hydration.
   */
  readonly initialState = (): ColorSchemeState => this.first;

  /**
   * Calls `listener` after every change of the snapshot; the shape `useSyncExternalStore` takes. Watches the system
   * preference while at least one listener is subscribed.
   *
   * @returns removes the listener; safe to call twice.
   */
  readonly subscribe = (listener: () => void): (() => void) => {
    const entry = () => listener();
    this.listeners.add(entry);
    this.stopWatchingSystem ??= this.system.subscribe(this.refresh);
    return () => {
      this.listeners.delete(entry);
      if (this.listeners.size > 0) return;
      this.stopWatchingSystem?.();
      this.stopWatchingSystem = undefined;
    };
  };

  /** Re-reads the choice and the preference and notifies subscribers when the snapshot changed. */
  private readonly refresh = (): void => {
    if (!this.sync()) return;
    // oxlint-disable-next-line unicorn/no-useless-spread -- reason: a copy, so a listener that unsubscribes another mid-loop does not skip it
    for (const listener of [...this.listeners]) listener();
  };

  /**
   * Replaces the snapshot when the choice or its resolution changed.
   *
   * @returns whether it changed.
   */
  private sync(): boolean {
    const next = this.read();
    if (next.scheme === this.current.scheme && next.resolved === this.current.resolved)
      return false;
    this.current = next;
    return true;
  }

  /** A fresh snapshot from `prefs` and the system preference. */
  private read(): ColorSchemeState {
    const stored = this.prefs.get(SCHEME_KEY);
    const scheme =
      this.config.schemes.find((candidate) => candidate === stored) ?? this.config.defaultScheme;
    return Object.freeze({
      scheme,
      resolved: scheme === "system" ? this.system.current() : scheme,
      setScheme: this.setScheme,
    });
  }
}
