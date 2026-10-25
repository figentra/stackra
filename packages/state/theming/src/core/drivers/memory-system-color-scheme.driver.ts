/**
 * Stackra file contract:
 * Purpose: `MemorySystemColorSchemeDriver`, the `memory` driver of `SystemColorScheme`: a preference held in memory,
 *          `light` until `set` changes it. The candidate on a server render, where no system preference exists, and
 *          the one a test drives (`fakeColorScheme({ system: "dark" })`).
 * Boundary: no platform API; `set` notifies only on a real change.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0294 (decisions 16 and 17).
 */
import { Driver } from "@stackra/container";
import type { ResolvedColorScheme } from "@stackra/ui/contracts";

import { SystemColorScheme } from "#contracts/ports/system-color-scheme.port";

/** A system preference kept in memory. */
export class MemorySystemColorSchemeDriver extends Driver(SystemColorScheme) {
  private preference: ResolvedColorScheme = "light";

  private readonly listeners = new Set<() => void>();

  /** The preference held now. */
  current(): ResolvedColorScheme {
    return this.preference;
  }

  /**
   * Changes the preference, as the operating system would, and notifies subscribers when it changed.
   *
   * @returns this driver, to chain.
   * @example
   * const system = new MemorySystemColorSchemeDriver().set("dark");
   */
  set(preference: ResolvedColorScheme): this {
    if (preference === this.preference) return this;
    this.preference = preference;
    // oxlint-disable-next-line unicorn/no-useless-spread -- reason: a copy, so a listener that unsubscribes another mid-loop does not skip it
    for (const listener of [...this.listeners]) listener();
    return this;
  }

  /**
   * Calls `listener` whenever `set` changes the preference.
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
