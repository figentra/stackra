/**
 * Stackra file contract:
 * Purpose: `REQUIREMENT_SCHEMA`, one entry of a member runway's `requires`: the engine and whether the resource is
 *          dedicated; a dedicated resource also states a one-line `reason` it cannot share.
 * Boundary: internal. The engine must be one ADR 0227 allows (`RequirementEngine`); that a driver exists for it is
 *           gen's check (STA-339), not this schema's.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decisions 1 and 5), ADR 0227.
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { RequirementEngine } from "#core/enums/requirement-engine.enum";

/** An engine, `dedicated` (false by default) and the reason a dedicated resource needs. */
export const REQUIREMENT_SCHEMA = z
  .strictObject({
    engine: z.enum(Enum.values(RequirementEngine) as [RequirementEngine, ...RequirementEngine[]], {
      error: `Expected an engine ADR 0227 allows: ${Enum.values(RequirementEngine).join(", ")}`,
    }),
    dedicated: z.boolean().default(false),
    reason: z.string().trim().min(1).optional(),
  })
  .refine((requirement) => !requirement.dedicated || requirement.reason !== undefined, {
    message: "A dedicated resource needs a reason: one line on why it cannot share",
    path: ["reason"],
  });
