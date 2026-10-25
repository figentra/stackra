/**
 * Stackra file contract:
 * Purpose: `DEVELOPER_SANDBOX_SCHEMA`, the shipped zod schema of `DeveloperSandbox`: the developer, the sandbox scope,
 *          the apps installed in it and when it expires.
 * Boundary: internal; `developer-sandbox.schema.ts` registers it. `expiresAt` is an ISO 8601 instant or null.
 * Runtime: isomorphic
 * Governing contract: ADR 0355 (decision 8: developer sandboxes).
 */
import { z } from "zod";

/** The shipped `DeveloperSandbox$`. */
export const DEVELOPER_SANDBOX_SCHEMA = z.object({
  developer: z.string().min(1),
  sandbox: z.string().min(1),
  apps: z.array(z.string().min(1)).default(() => []),
  expiresAt: z.iso.datetime({ offset: true }).nullable().default(null),
});
