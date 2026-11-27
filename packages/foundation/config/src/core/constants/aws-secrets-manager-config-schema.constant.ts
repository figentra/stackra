/**
 * Stackra file contract:
 * Purpose: `AWS_SECRETS_MANAGER_CONFIG_SCHEMA`, the zod schema this package ships for `AwsSecretsManagerConfig`
 *          (exported as `AwsSecretsManagerConfig$`): the region, the secret ids read at load and the per-request
 *          timeout.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults; they equal `AwsSecretsManagerOptions`' initializers (tested). Ids only, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0173 (no secret values in config).
 */
import { z } from "zod";

/** The shipped `AwsSecretsManagerConfig$`. */
export const AWS_SECRETS_MANAGER_CONFIG_SCHEMA = z.object({
  region: z.string().default(""),
  secretIds: z.array(z.string().min(1)).default(() => []),
  timeoutMs: z.number().int().min(100).max(60_000).default(10_000),
});
