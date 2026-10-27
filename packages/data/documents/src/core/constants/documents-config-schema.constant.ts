/**
 * Stackra file contract:
 * Purpose: `DOCUMENTS_CONFIG_SCHEMA`, the zod schema this package ships for `DocumentsConfig` (exported as
 *          `DocumentsConfig$`): where the `gotenberg` drivers reach the engine and how long a call may take.
 * Boundary: the stand-in for what gen writes for this package. Every field has a default, so `.parse({})` gives the
 *           full defaults; they equal `DocumentsOptions`' initializers (tested). `gotenbergAuthorization` is the
 *           `DOCUMENTS_GOTENBERG_AUTHORIZATION` secret, never a value; empty sends no `authorization` header.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26: a package ships its own `X$`); ADR 0365 (decision 2); ADR 0173.
 */
import { z } from "zod";

/** The shipped `DocumentsConfig$`. */
export const DOCUMENTS_CONFIG_SCHEMA = z.object({
  gotenbergUrl: z.url().default("http://127.0.0.1:3000"),
  gotenbergTimeoutMs: z.number().int().min(1).default(30_000),
  gotenbergAuthorization: z.string().default(""),
});
