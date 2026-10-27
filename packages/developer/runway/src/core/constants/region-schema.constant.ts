/**
 * Stackra file contract:
 * Purpose: `REGION_SCHEMA`, one `regions.<key>` entry of the root runway: the cloud (required), the cloud region it
 *          runs in (required), the account or project that holds it, and the jurisdiction its data stays in.
 * Boundary: internal; the root runway schema composes it. Strict, as the canonical `$defs/region` is: a region without
 *           a cloud or a location fails. The account is a public id or `ref:`, never a secret.
 * Runtime: isomorphic
 * Governing contract: ADR 0354 (decisions 2 and 4: a cloud dimension; one AWS account per product-region), ADR 0353
 *                     (data residency), ADR 0171 (`ref:` values).
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { RunwayCloud } from "#core/enums/runway-cloud.enum";

/** The schema of one `regions.<key>` entry of the root runway. */
export const REGION_SCHEMA = z.strictObject({
  cloud: z.enum(Enum.values(RunwayCloud) as [RunwayCloud, ...RunwayCloud[]]),
  location: z.string().min(1),
  account: z.union([z.string(), z.number(), z.boolean()]).optional(),
  jurisdiction: z.string().optional(),
});
