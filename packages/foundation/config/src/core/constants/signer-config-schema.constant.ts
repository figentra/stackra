/**
 * Stackra file contract:
 * Purpose: `SIGNER_CONFIG_SCHEMA`, the zod schema this package ships for `SignerConfig` (exported as `SignerConfig$`):
 *          the key id signatures name, the KMS key the `kms` driver signs with and the region its
 *          `aws-sdk` client calls.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults; they equal `SignerOptions`' initializers (tested). Ids only, never a key.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0416.
 */
import { z } from "zod";

/** The shipped `SignerConfig$`. */
export const SIGNER_CONFIG_SCHEMA = z.object({
  keyId: z.string().default(""),
  kmsKeyId: z.string().default(""),
  region: z.string().default(""),
});
