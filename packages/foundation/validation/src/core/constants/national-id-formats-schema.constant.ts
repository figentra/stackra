/**
 * Stackra file contract:
 * Purpose: `NATIONAL_ID_FORMATS_SCHEMA`, the shipped `NationalIdFormats$`: parses the market pack's
 *          `identity.national_ids` value (each identity document the Market issues, by its kind code, such as
 *          `national_id` or `residence_permit`, to its `IdentifierFormat`) for `nationalId(formats)`.
 * Boundary: shape only. Kind codes are pack data in snake_case; no kind or country is written in code.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0417; ADR 0231 (snake_case codes); OS parties gap (STA-1269).
 */
import { z } from "zod";

import { IDENTIFIER_FORMAT_SCHEMA } from "#core/constants/identifier-format-schema.constant";
import type { IdentifierFormat } from "#core/types/identifier-format.type";

/** The shipped `NationalIdFormats$`. */
export const NATIONAL_ID_FORMATS_SCHEMA: z.ZodType<Readonly<Record<string, IdentifierFormat>>> =
  z.record(z.string().regex(/^[a-z][a-z0-9_]*$/), IDENTIFIER_FORMAT_SCHEMA);
