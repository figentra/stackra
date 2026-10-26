/**
 * Stackra file contract:
 * Purpose: `ETA_ONBOARDING_OPTIONS`, the pack options `EtaOnboardingDriver` reads from the Egyptian till mandate: the
 *          identity endpoint a POS gets its access token from.
 * Boundary: a zod schema constant: the shape of pack data, not its values. It sits beside the mandate's other options
 *           (other keys pass through), and a pack that leaves the endpoint out is refused by `parseOptions`.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decisions 2 and 4); ADR 0363 (decision 3).
 */
import { z } from "zod";

/** Options of `EtaOnboardingDriver`. */
export const ETA_ONBOARDING_OPTIONS = z.object({
  /** The identity service's token endpoint (OAuth 2.0 client credentials). */
  tokenUrl: z.url(),
});
