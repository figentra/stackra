/**
 * Stackra file contract:
 * Purpose: `PrayerMethod`, how one market computes prayer times, as `PrayerMethod$` returns it from the pack key
 *          `calendar.prayer_times`.
 * Boundary: a type only, the output of `PrayerMethod$`, so the type and the check never disagree.
 * Runtime: isomorphic
 * Governing contract: ADR 0414 (decision 2).
 */
import type { z } from "zod";

import type { PRAYER_METHOD_SCHEMA } from "#core/constants/prayer-method-schema.constant";

/** One calculation method. */
export type PrayerMethod = z.output<typeof PRAYER_METHOD_SCHEMA>;
