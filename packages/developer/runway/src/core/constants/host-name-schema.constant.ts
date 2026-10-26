/**
 * Stackra file contract:
 * Purpose: `HOST_NAME_SCHEMA`, a lower-case DNS name or a name relative to the environment's zone (`console.mezzora`,
 *          `console.mezzora.figentra.com`).
 * Boundary: internal; a surface's `host` (relative to `environments.<env>.domains.zone`) and a mobile app's
 *           `identity.links` (full names) use it. No scheme, port or path.
 * Runtime: isomorphic
 * Governing contract: ADR 0436 (decision 11: hosts), ADR 0437 (decision 6: `host:` rows), ADR 0439 (decision 2).
 */
import { z } from "zod";

/** `console.mezzora`. */
export const HOST_NAME_SCHEMA = z
  .string()
  .regex(
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/,
    "Expected a lower-case host name, such as console.acme",
  );
