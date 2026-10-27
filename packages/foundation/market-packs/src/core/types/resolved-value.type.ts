/**
 * Stackra file contract:
 * Purpose: `ResolvedValue`, the answer to "the value of X for market M on date D": the value, the market and pack
 *          version it came from and, for a legal floor, its bound and law, so a refusal can say which pack and law set it.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decisions 5 and 6); ADR 0363 (decision 4).
 */
import type { PackEntry } from "#core/types/pack-entry.type";
import type { PackValue } from "#core/types/pack-value.type";

/** The value of one pack entry in force for a market on a date, and where it came from. */
export type ResolvedValue = {
  /** The pack entry's key. */
  readonly key: string;
  /** The value in force for the market on the date. */
  readonly value: PackValue;
  /** The market whose pack set it (the overlay or a parent). */
  readonly market: string;
  /** The version of that pack. */
  readonly version: string;
  /** Present when the entry is a legal floor. */
  readonly floor?: NonNullable<PackEntry["floor"]>;
};
