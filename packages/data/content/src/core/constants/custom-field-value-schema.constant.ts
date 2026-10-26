/**
 * Stackra file contract:
 * Purpose: `CUSTOM_FIELD_VALUE_SCHEMA`, the shipped `CustomFieldValue$`: one stored custom field value (a string, a
 *          finite number, a boolean or a list of strings).
 * Boundary: shape only. Whether the value fits its definition (type, bounds, choices) is `checkCustomFields`, which
 *           needs the definitions; a service that stores values runs that check before it writes.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0116; STA-1284.
 */
import { z } from "zod";

import type { CustomFieldValue } from "#core/types/custom-field-value.type";

/** The shipped `CustomFieldValue$`. */
export const CUSTOM_FIELD_VALUE_SCHEMA: z.ZodType<CustomFieldValue> = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
]);
