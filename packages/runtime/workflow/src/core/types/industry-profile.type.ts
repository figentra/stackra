/**
 * Stackra file contract:
 * Purpose: `IndustryProfile`, a parsed industry profile: its key, label and a customization per checklist, as `IndustryProfile$` parses it.
 * Boundary: a type only, inferred from the shipped schema so the two never drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0424.
 */
import type { z } from "zod";

import type { INDUSTRY_PROFILE_SCHEMA } from "#core/constants/industry-profile-schema.constant";

/** A parsed industry profile: its key, label and a customization per checklist. */
export type IndustryProfile = z.output<typeof INDUSTRY_PROFILE_SCHEMA>;
