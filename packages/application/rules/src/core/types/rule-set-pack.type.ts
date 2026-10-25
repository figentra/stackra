/**
 * Stackra file contract:
 * Purpose: `RuleSetPack`, a versioned document of default rule sets, as `RuleSetPack$` parses it: its key, its version
 *          and its templates.
 * Boundary: a type only, inferred from the shipped schema so the two never drift.
 * Runtime: isomorphic
 * Governing contract: config-model sections 4 and 6; ADR 0331 (decision 5).
 */
import type { z } from "zod";

import type { RULE_SET_PACK_SCHEMA } from "#core/constants/rule-set-pack-schema.constant";

/** A parsed rule-set pack. */
export type RuleSetPack = z.infer<typeof RULE_SET_PACK_SCHEMA>;
