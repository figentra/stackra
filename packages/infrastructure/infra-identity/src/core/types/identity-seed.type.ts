/**
 * Stackra file contract:
 * Purpose: `IdentitySeed`, the checked `.stackra/zitadel/seed.yaml`, with every default filled.
 * Boundary: a type only, derived from the internal schema so the two cannot drift.
 * Runtime: isomorphic
 * Governing contract: ADR 0206 (decisions 4, 5 and 8), ADR 0199 (decision 3).
 */
import type { z } from "zod";

import type { IDENTITY_SEED_SCHEMA } from "#core/constants/identity-seed-schema.constant";

/** The seed `parseIdentitySeed` returns. */
export type IdentitySeed = z.output<typeof IDENTITY_SEED_SCHEMA>;
