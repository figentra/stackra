/**
 * Stackra file contract:
 * Purpose: `TEST_SCOPE_ID`, the tenant scope a test's user actors act in by default, so a call through the pipeline
 *          has a tenant and a tenant-owned row (`BelongsToTenant`) can be written without each test naming one.
 * Boundary: test code only; a fixed, well-formed scope public id (`scp_…`), so two runs act in the same tenant.
 * Runtime: node
 * Governing contract: ADR 0098 (decision 7: the actor's scope is the call's tenant); ADR 0269 (decision 3).
 */
import type { PublicId } from "@stackra/contracts";

/** The default test tenant. */
export const TEST_SCOPE_ID = "scp_01j9z3k4m5n6p7q8r9s0t1v2t1" as PublicId<"scp">;
