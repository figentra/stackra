/**
 * Stackra file contract:
 * Purpose: `SYNONYM_VIEW_SCHEMA`, the zod schema of a `SynonymView`, shared by the outputs of the synonym actions and
 *          query.
 * Boundary: data only, internal to this package; built on `SYNONYM_FIELDS` so the term rules stay one.
 * Runtime: node
 * Governing contract: ADR 0492 (decision 5); ADR 0294 (decision 26).
 */
import { publicId } from "@stackra/validation";

import { SYNONYM_FIELDS } from "#node/constants/synonym-fields-schema.constant";

/** The schema of one synonym set as a caller sees it. */
export const SYNONYM_VIEW_SCHEMA = SYNONYM_FIELDS.extend({ id: publicId("syn") });
