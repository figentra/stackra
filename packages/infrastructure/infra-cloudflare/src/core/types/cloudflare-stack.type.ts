/**
 * Stackra file contract:
 * Purpose: `CloudflareStack`, the core stack's Cloudflare config as `parseCloudflareStack` returns it (defaults
 *          applied).
 * Boundary: type only, inferred from the one schema.
 * Runtime: isomorphic
 * Governing contract: ADR 0171 (decision 6), ADR 0290 (decisions 1 to 6, 11 and 15).
 */
import type { z } from "zod";

import type { CLOUDFLARE_STACK_SCHEMA } from "#core/constants/cloudflare-stack-schema.constant";

/** The core stack's Cloudflare config. */
export type CloudflareStack = z.output<typeof CLOUDFLARE_STACK_SCHEMA>;
