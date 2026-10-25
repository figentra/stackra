/**
 * Stackra file contract:
 * Purpose: `PackValue`, the JSON value a pack entry holds: a rate, a number of days, a provider key, a list of
 *          methods, a calendar section.
 * Boundary: a type only. The consumer checks a value against its own schema (for example `BusinessCalendar$`).
 * Runtime: isomorphic
 * Governing contract: ADR 0370 (decision 5).
 */
import type { PackEntry } from "#core/types/pack-entry.type";

/** One entry's value. */
export type PackValue = PackEntry["value"];
