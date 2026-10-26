/**
 * Stackra file contract:
 * Purpose: `FACT_SOURCE_SCHEMA`, the zod schema of a `FactSource` as JSON (its `X$`): the form in which one service
 *          publishes the fields its rules may test, so another service (Access checking a condition that names a
 *          commerce field) builds a `Rules` registry from it and checks a condition's fields at write time.
 * Boundary: shape only: a camelCase key and at least one camelCase field, each with a `FieldType` code, a lang key and,
 *           for an enum, its values. `Rules.create` still checks the declarations (an enum and only an enum lists
 *           values), so a published source is held to the same rules as a coded one.
 * Runtime: isomorphic
 * Governing contract: ADR 0331 (decisions 4 and 11); ADR 0294 (decision 26); ADR 0425 (decision 4).
 */
import { Enum } from "@stackra/contracts";
import type { I18nKey } from "@stackra/i18n";
import { z } from "zod";

import { type FactSource, FIELD_KEY, FieldType } from "#contracts/index";

/** A camelCase key of 1 to 63 characters: the one casing (`FIELD_KEY`). */
const KEY = z.string().regex(FIELD_KEY, "Expected a camelCase key");

/** A lang key (`<module>::<path>`). */
const LABEL = z
  .string()
  .regex(/^[a-z][a-z0-9_-]*::[a-z0-9_.-]+$/, "Expected a lang key such as module::path")
  .transform((value) => value as I18nKey);

/** The shipped `FactSource$`. */
export const FACT_SOURCE_SCHEMA: z.ZodType<FactSource> = z.object({
  key: KEY,
  fields: z
    .record(
      KEY,
      z.object({
        type: z.enum(Enum.values(FieldType) as [FieldType, ...FieldType[]]),
        label: LABEL,
        values: z.record(z.string().min(1).max(63), LABEL).optional(),
      }),
    )
    .refine((fields) => Object.keys(fields).length > 0, { message: "Expected at least one field" }),
}) as unknown as z.ZodType<FactSource>;
