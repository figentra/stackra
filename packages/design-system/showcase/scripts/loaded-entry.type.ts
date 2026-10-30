/**
 * Stackra file contract:
 * Purpose: `LoadedEntry`, a registry entry with the constant that exports it and its `#src` module path.
 * Boundary: a type only, in its own file (ADR 0305).
 * Runtime: node
 * Governing contract: showcase redesign spec (2026-10-27) section 7.2.
 */
import type { ComponentEntry } from "../src/types/component-entry.type.ts";

/** One loaded registry entry file. */
export interface LoadedEntry {
  readonly constant: string;
  readonly module: string;
  readonly entry: ComponentEntry;
}
