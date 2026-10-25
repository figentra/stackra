/**
 * Stackra file contract:
 * Purpose: `RULE_SET_PACK_SCHEMA`, the zod schema of `RuleSetPack` (its `X$`): a versioned document of default rule
 *          sets that a product's seed pack ships (`rule-set:commerce:returns`), each a template with a key, the consumer
 *          it is for, its condition and its outcomes.
 * Boundary: shape only. The conditions and outcomes are checked against each consumer's `Rules` when seeded, so this
 *           schema keeps them as JSON. Pack and template keys are dotted lowercase paths; versions are
 *           `major.minor.patch`; template keys are unique within a pack.
 * Runtime: isomorphic
 * Governing contract: config-model sections 4 and 6 (rule sets ship as versioned seed documents); ADR 0331 (decision
 *                     5); ADR 0294 (decision 26: a package ships its own `X$`).
 */
import { z } from "zod";

/** A dotted lowercase key. */
const KEY = z.string().regex(/^[a-z0-9_]+(\.[a-z0-9_]+)*$/, "Expected a dotted lowercase key");

/** The shipped `RuleSetPack$`. */
export const RULE_SET_PACK_SCHEMA = z
  .object({
    key: KEY,
    version: z
      .string()
      .regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/, "Expected major.minor.patch"),
    ruleSets: z.array(
      z.object({
        key: KEY,
        consumer: z.string().min(1),
        condition: z.json(),
        outcomes: z.array(z.json()).default([]),
      }),
    ),
  })
  .refine(
    (pack) => new Set(pack.ruleSets.map((ruleSet) => ruleSet.key)).size === pack.ruleSets.length,
    { message: "Two rule sets share a key", path: ["ruleSets"] },
  );
