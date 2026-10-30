/**
 * Stackra file contract:
 * Purpose: `TESTBED_PLAN_INPUT_SCHEMA`, the zod schema of the few inputs `testbedPlan` takes: region, group counts and
 *          the two Infisical ids. Every field is optional; the plan fills the owner's answers of 2026-10-30.
 * Boundary: a schema only; pure and Pulumi-free. The ids are ids, never secrets.
 * Runtime: isomorphic
 * Governing contract: ADR 0484 (decisions 8 and 9); ADR 0173.
 */
import { z } from "zod";

const COUNT = z.number().int().min(0).max(50);

/** What a caller may set; every field defaults to the owner's answers of 2026-10-30. */
export const TESTBED_PLAN_INPUT_SCHEMA = z
  .object({
    region: z.string().optional(),
    heavy: z
      .object({ min: COUNT.optional(), max: COUNT.min(1).optional() })
      .strict()
      .optional(),
    light: z
      .object({ min: COUNT.optional(), max: COUNT.min(1).optional() })
      .strict()
      .optional(),
    /** Infisical machine identity id (`figentra-ci-boxes`), from Pulumi config. */
    identityId: z.string().min(1).optional(),
    /** Infisical project id of `figentra-ci-gate`, from Pulumi config; without it no project has a grant. */
    ciGateProjectId: z.string().min(1).optional(),
    /** The Infisical environment slug the grants read. */
    infisicalEnvironment: z.string().min(1).optional(),
  })
  .strict();
