/**
 * Stackra file contract:
 * Purpose: `KnobsPlaygroundProps`, the props of `KnobsPlayground` in `knobs-playground.tsx`.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); STA-1371 (doc pages wave, 2026-10-28).
 */
import type { ApiPart, ComponentEntry } from "@stackra/showcase";

/** The entry and its first API part. */
export interface KnobsPlaygroundProps {
  /** The registry entry the knobs belong to. */
  readonly entry: ComponentEntry;
  /** The part the knobs edit (the root). */
  readonly part: ApiPart;
  /** The entry's title, used as the children and label seed. */
  readonly title: string;
  /** True to pass `title` as children. */
  readonly hasChildren: boolean;
}
