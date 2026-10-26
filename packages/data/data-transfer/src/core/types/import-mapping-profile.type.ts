/**
 * Stackra file contract:
 * Purpose: `ImportMappingProfile`, a parsed import mapping profile: its key and, per sheet in dependency order, the
 *          target name and the column mapping.
 * Boundary: a type only, inferred from `IMPORT_MAPPING_PROFILE_SCHEMA`.
 * Runtime: isomorphic
 * Governing contract: ADR 0431 (decision 1).
 */
import type { z } from "zod";

import type { IMPORT_MAPPING_PROFILE_SCHEMA } from "#core/constants/import-mapping-profile-schema.constant";

/** An import mapping profile. */
export type ImportMappingProfile = z.infer<typeof IMPORT_MAPPING_PROFILE_SCHEMA>;
