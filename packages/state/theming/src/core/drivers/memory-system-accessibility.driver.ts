/**
 * Stackra file contract:
 * Purpose: `MemorySystemAccessibilityDriver`, the `memory` driver of `SystemAccessibility`: settings held in memory,
 *          `DEFAULT_ACCESSIBILITY_SETTINGS` until `set` changes them. The candidate on a server render, where no system
 *          settings exist, and the one a test drives.
 * Boundary: no platform API; `set` replaces the snapshot and notifies only on a real change.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0302 (decision 3, 2026-10-29 note).
 */
import { Driver } from "@stackra/container";

import { DEFAULT_ACCESSIBILITY_SETTINGS } from "#contracts/constants/default-accessibility-settings.constant";
import { SystemAccessibility } from "#contracts/ports/system-accessibility.port";
import type { AccessibilitySettings } from "#contracts/types/accessibility-settings.type";

/** Accessibility settings kept in memory. */
export class MemorySystemAccessibilityDriver extends Driver(SystemAccessibility) {
  private settings = DEFAULT_ACCESSIBILITY_SETTINGS;

  private readonly listeners = new Set<() => void>();

  /** The settings held now. */
  current(): AccessibilitySettings {
    return this.settings;
  }

  /**
   * Changes some settings, as the operating system would, and notifies subscribers when one changed.
   *
   * @returns this driver, to chain.
   * @example
   * const system = new MemorySystemAccessibilityDriver().set({ reduceMotion: true, fontScale: 1.5 });
   */
  set(change: Partial<AccessibilitySettings>): this {
    const next = { ...this.settings, ...change };
    const keys = Object.keys(next) as (keyof AccessibilitySettings)[];
    if (keys.every((key) => next[key] === this.settings[key])) return this;
    this.settings = Object.freeze(next);
    // oxlint-disable-next-line unicorn/no-useless-spread -- reason: a copy, so a listener that unsubscribes another mid-loop does not skip it
    for (const listener of [...this.listeners]) listener();
    return this;
  }

  /**
   * Calls `listener` whenever `set` changes a setting.
   *
   * @returns removes the listener.
   */
  subscribe(listener: () => void): () => void {
    const entry = () => listener();
    this.listeners.add(entry);
    return () => {
      this.listeners.delete(entry);
    };
  }
}
