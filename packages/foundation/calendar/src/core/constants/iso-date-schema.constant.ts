/**
 * Stackra file contract:
 * Purpose: `ISO_DATE_SCHEMA`, the shipped `IsoDate$`: a Gregorian date as `YYYY-MM-DD`, refusing an impossible one
 *          (`2026-02-30`).
 * Boundary: shape only; the one storage form of a date (ADR 0366 decision 2). `stackra gen` compiles a field typed
 *           `IsoDate` to it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0366 (decision 2); STA-1284.
 */
import { z } from "zod";

import type { IsoDate } from "#core/types/iso-date.type";

/** The shipped `IsoDate$`. */
export const ISO_DATE_SCHEMA: z.ZodType<IsoDate, string> = z.iso.date();
