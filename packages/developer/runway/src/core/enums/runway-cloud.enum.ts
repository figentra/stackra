/**
 * Stackra file contract:
 * Purpose: `RunwayCloud`, the clouds a runway region can name: AWS and GCP.
 * Boundary: an `Enum.of` value plus the type of the same name. Which cloud serves which region is data in the root
 *           runway's `regions`, never a choice in code; a third cloud needs a new ADR.
 * Runtime: isomorphic
 * Governing contract: ADR 0354 (decisions 1 and 4), ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/** One case per supported cloud. */
export const RunwayCloud = Enum.of({
  /** Amazon Web Services: one account per product and region. */
  Aws: "aws",
  /** Google Cloud. */
  Gcp: "gcp",
});

/** One of the codes above. */
export type RunwayCloud = Enum.Value<typeof RunwayCloud>;
