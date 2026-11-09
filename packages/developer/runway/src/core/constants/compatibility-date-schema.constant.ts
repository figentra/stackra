/**
 * Stackra file contract:
 * Purpose: `COMPATIBILITY_DATE_SCHEMA`, a `YYYY-MM-DD` Workers compatibility date.
 * Boundary: internal; see `workerSettingsOf`.
 * Runtime: isomorphic
 * Governing contract: ADR 0519 (decision 2); STA-1988.
 */
import { z } from "zod";

/** A `YYYY-MM-DD` Workers compatibility date. */
export const COMPATIBILITY_DATE_SCHEMA = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
