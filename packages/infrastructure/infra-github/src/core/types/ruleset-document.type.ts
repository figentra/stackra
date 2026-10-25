/**
 * Stackra file contract:
 * Purpose: `RulesetDocument`, one committed `.github/rulesets/<name>.json` as `parseRuleset` returns it: GitHub's REST
 *          ruleset body (snake_case, as GitHub exports it), limited to the rules this package applies.
 * Boundary: type only, inferred from the one schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (decision 8).
 */
import type { z } from "zod";

import type { RULESET_DOCUMENT_SCHEMA } from "#core/constants/ruleset-document-schema.constant";

/** One repository ruleset. */
export type RulesetDocument = z.output<typeof RULESET_DOCUMENT_SCHEMA>;
