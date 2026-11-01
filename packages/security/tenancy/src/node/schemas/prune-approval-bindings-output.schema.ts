/**
 * Stackra file contract:
 * Purpose: `PruneApprovalBindingsOutput`, the output of `tenancy.approval_binding.prune@1`: how many approval bindings
 *          the run deleted.
 * Boundary: a shape class in its own file; it registers its schema when the module loads (STA-339 replaces the
 *           registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4 and 26); ADR 0305 (Input and Output in their own files); ADR 0509 (N7);
 *                     STA-1884.
 */
import { Int, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

/**
 * The count of bindings the run deleted.
 *
 * @example
 * return PruneApprovalBindingsOutput.create({ deleted: 3 });
 */
export class PruneApprovalBindingsOutput extends Schema {
  /** Bindings deleted by this run. */
  @Int({ min: 0 })
  deleted!: number;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[PruneApprovalBindingsOutput, z.object({ deleted: z.number().int().min(0) })]]);
