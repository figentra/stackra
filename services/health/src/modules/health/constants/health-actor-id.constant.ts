/**
 * Stackra file contract:
 * Purpose: `HEALTH_ACTOR_ID`, the public id of the platform actor the pipeline probe calls as.
 * Boundary: a constant; a well-formed `sys_` public id (26 Crockford base32 characters), the same on every call.
 * Runtime: node
 * Governing contract: ADR 0135 (public ids); ADR 0098 (actor kinds: `system` is the platform itself).
 */
import type { PublicId } from "@stackra/contracts";

/** The system actor of the health probe. */
export const HEALTH_ACTOR_ID = "sys_01hea1th000000000000000000" as PublicId<"sys">;
