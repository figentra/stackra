/**
 * Stackra file contract:
 * Purpose: `noLicences`: the binding until stackra-183: no token is known.
 * Boundary: the port and its empty binding only. The D1 adapter over `licences`, `licence_grants` and
 *           `licence_tokens` is stackra-183's (workers/registry licence folder); the read rule over the result is
 *           `readAccess`'s.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decisions 10 and 13); stackra-183 (STA-1335).
 */
import type { LicenceCheck } from "#src/access/licence-check.port";

/** The binding until stackra-183: no token is known. */
export const noLicences: LicenceCheck = { check: async () => null };
