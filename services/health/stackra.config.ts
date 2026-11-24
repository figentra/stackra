/**
 * Stackra file contract:
 * Purpose: the member definition of @figentra/service-health: static data that gen reads from the syntax tree
 *          without running it. The member key is derived from the folder name; there is no key option.
 * Boundary: data only; no call other than `defineService` and no environment read. The probes answer callers
 *           without a session, so the area is `public`.
 * Runtime: node
 * Governing contract: ADR 0295 (decisions 1 and 9); ADR 0294 (rule R12); ADR 0082 (API areas).
 */
import { ApiArea, defineService } from "@stackra/contracts";

/** Read by `stackra gen` and `stackra validate`. */
export default defineService({ area: ApiArea.Public });
