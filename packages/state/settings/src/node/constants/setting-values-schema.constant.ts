/**
 * Stackra file contract:
 * Purpose: `SETTING_VALUES_SCHEMA`, the zod form of a stored group's values by path (`Record<string, SettingValue>`),
 *          the `@Field` hatch of the stored-setting models' `values` and `previous` columns.
 * Boundary: data only, internal to this package. `SettingValue` is a union of scalars and a string list, which no
 *           shape type states, so the models carry it through this hatch (ADR 0294 decision 26); the generated
 *           `X$Check` holds the hatch to that union, a list of strings included (STA-1605).
 * Runtime: node
 * Governing contract: ADR 0294 (decision 26); ADR 0213 (decision 1).
 */
import { z } from "zod";

/** A group's values by path: each a boolean, a number, a string, a list of strings or `null`. */
export const SETTING_VALUES_SCHEMA = z.record(
  z.string(),
  z.union([z.boolean(), z.number(), z.string(), z.array(z.string()), z.null()]),
);
