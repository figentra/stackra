/**
 * Stackra file contract:
 * Purpose: `SlotGroup`, one branch of a `slots({...})` tree: a list of slot names (their places follow from the name), a
 *          map of slot names to places, or nested groups.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 18).
 */
import type { Place } from "#core/enums/place.enum";

/** A branch of a slot tree. */
export type SlotGroup = readonly string[] | { readonly [name: string]: Place | SlotGroup };
