/**
 * Stackra file contract:
 * Purpose: `PruneApprovalBindingsInput`, the input of `tenancy.approval_binding.prune@1`: nothing, since the daily job
 *          derives its cutoff from the clock and runs once per tenant.
 * Boundary: a shape class in its own file; it registers its schema when the module loads (STA-339 replaces the
 *           registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4 and 26); ADR 0305 (Input and Output in their own files); ADR 0509 (N7);
 *                     STA-1884.
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/**
 * No input: the job prunes by the clock.
 *
 * @example
 * await pipeline.execute(PruneApprovalBindingsAction, PruneApprovalBindingsInput.create({}), { actor: systemActor });
 */
export class PruneApprovalBindingsInput extends Schema {}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[PruneApprovalBindingsInput, z.object({})]]);
