/**
 * Stackra file contract:
 * Purpose: `LoadedEntry`, a registry entry with the constant that exports it and its `#src` module path, or a module
 *          kit's entry (no module: the barrel inlines it, ADR 0503).
 * Boundary: a type only, in its own file (ADR 0305).
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2.
 */
import type { ComponentEntry } from "../src/types/component-entry.type.ts";

/** One loaded registry entry file. */
export interface LoadedEntry {
  readonly constant: string;
  /** The `#src` module of a showcase entry file; absent for a kit entry, which the barrel inlines. */
  readonly module?: string;
  readonly entry: ComponentEntry;
}
