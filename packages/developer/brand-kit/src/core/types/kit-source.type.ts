/**
 * Stackra file contract:
 * Purpose: `KitSource`, a key of `KIT_SOURCES` (a named kit source file).
 * Boundary: a type of the `.` entry; no runtime value.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended).
 */
import type { KIT_SOURCES } from "#core/constants/kit-sources.constant";

/** A key of `KIT_SOURCES`. */
export type KitSource = keyof typeof KIT_SOURCES;
