/**
 * Stackra file contract:
 * Purpose: `MemoryDimensionValuesDriver`, the `DimensionValues` projection held in memory: the consuming service's
 *          listeners `project` each value the owning service's events make live and `retire` each one they end.
 * Boundary: process-local; a restart starts with nothing live, so a condition naming a foreign dimension denies until
 *           the events are replayed (ADR 0351 decision 4), exactly as with no driver. A service that needs the values
 *           to survive a restart binds its own event-fed projection driver instead.
 * Runtime: isomorphic
 * Governing contract: ADR 0351 (decisions 1 to 4); ADR 0263 (a driver is named by its class: `memory`).
 */
import { Driver } from "@stackra/container";

import { DimensionValues } from "#contracts/index";

/**
 * Projected dimension values held in memory.
 *
 * @example
 * dimensions.project("channel", "chn_web");
 * dimensions.isLive("channel", "chn_web"); // true
 */
export class MemoryDimensionValuesDriver extends Driver(DimensionValues) {
  /** Dimension to its live value ids. */
  private readonly values = new Map<string, Set<string>>();

  /** Marks `id` a live value of `dimension`. */
  project(dimension: string, id: string): void {
    const live = this.values.get(dimension) ?? new Set<string>();
    live.add(id);
    this.values.set(dimension, live);
  }

  /** Marks `id` no longer a live value of `dimension`. */
  retire(dimension: string, id: string): void {
    this.values.get(dimension)?.delete(id);
  }

  /** Whether `id` is a live value of `dimension`. */
  isLive(dimension: string, id: string): boolean {
    return this.values.get(dimension)?.has(id) ?? false;
  }

  /** Every live value of `dimension`. */
  live(dimension: string): readonly string[] {
    return [...(this.values.get(dimension) ?? [])];
  }
}
