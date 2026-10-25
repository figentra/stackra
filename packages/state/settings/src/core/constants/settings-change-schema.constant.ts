/**
 * Stackra file contract:
 * Purpose: `SETTINGS_CHANGE_SCHEMA`, the zod schema of `SettingsChange` (its `X$`): one row of a settings diff.
 * Boundary: shape only. A diff handed back to `SettingsPromotableDriver#apply` has travelled through the OS promotion
 *           record, so its rows are parsed again before anything is written.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 4); ADR 0359 (decision 6); ADR 0294 (decision 26).
 */
import { z } from "zod";

/** A setting value. */
const VALUE = z.union([z.boolean(), z.number(), z.string(), z.null()]);

/** The shipped `SettingsChange$`. */
export const SETTINGS_CHANGE_SCHEMA = z.object({
  group: z.string().regex(/^[a-z][a-z0-9_]*$/, "Expected a module key"),
  path: z
    .string()
    .regex(/^[A-Za-z][A-Za-z0-9]*(\.[A-Za-z][A-Za-z0-9]*)?$/, "Expected a setting path"),
  before: VALUE.exactOptional(),
  after: VALUE.exactOptional(),
  lockedBefore: z.boolean(),
  lockedAfter: z.boolean(),
});
