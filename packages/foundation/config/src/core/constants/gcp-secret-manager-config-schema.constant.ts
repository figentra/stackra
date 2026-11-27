/**
 * Stackra file contract:
 * Purpose: `GCP_SECRET_MANAGER_CONFIG_SCHEMA`, the zod schema this package ships for `GcpSecretManagerConfig`
 *          (exported as `GcpSecretManagerConfig$`): the project, the optional location of regional secrets, the
 *          secret ids read at load and the per-request timeout.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults; they equal `GcpSecretManagerOptions`' initializers (tested). Ids only, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0371 (amendment 2026-11-27).
 */
import { z } from "zod";

/** A Secret Manager secret id, optionally pinned to a version (`RESEND_API_KEY@3`); `latest` when not pinned. */
const SECRET_ID = /^[A-Za-z0-9_-]{1,255}(?:@(?:latest|[1-9][0-9]*))?$/;

/** The shipped `GcpSecretManagerConfig$`. */
export const GCP_SECRET_MANAGER_CONFIG_SCHEMA = z.object({
  project: z
    .string()
    .regex(/^(?:[a-z][a-z0-9-]{4,28}[a-z0-9])?$/, "a Google Cloud project id")
    .default(""),
  location: z
    .string()
    .regex(/^(?:[a-z]+-[a-z]+[0-9]+)?$/, "a Google Cloud region, such as me-central2")
    .default(""),
  secretIds: z
    .array(z.string().regex(SECRET_ID, "a secret id, optionally @<version>"))
    .default(() => []),
  timeoutMs: z.number().int().min(100).max(60_000).default(10_000),
});
