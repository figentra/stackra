/**
 * Stackra file contract:
 * Purpose: `ENVIRONMENT_CLOUD_SCHEMA`, the `cloud` of a root environment or of a dedicated deployment: which cloud its
 *          foundation runs on and which account (AWS, a key of `providers.aws.accounts`) or project (GCP, a key of
 *          `providers.gcp.projects`) holds it.
 * Boundary: internal; the root environment and dedicated schemas compose it. Strict, as the canonical `$defs/cloud`
 *           is. The account is a key into the provider section, never an id: ids stay in `providers` (`ref:` values).
 *           `checkRegions` reports a key the provider section does not hold.
 * Runtime: isomorphic
 * Governing contract: ADR 0354 (decision 4: the cloud dimension; it replaces `providers.gcp.environments`), ADR 0400.
 */
import { Enum } from "@stackra/contracts";
import { z } from "zod";

import { RunwayCloud } from "#core/enums/runway-cloud.enum";

/** One environment's cloud. */
export const ENVIRONMENT_CLOUD_SCHEMA = z.strictObject({
  name: z.enum(Enum.values(RunwayCloud) as [RunwayCloud, ...RunwayCloud[]]),
  account: z.string().min(1),
});
