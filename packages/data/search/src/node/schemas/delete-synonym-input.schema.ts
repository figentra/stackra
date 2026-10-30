/**
 * Stackra file contract:
 * Purpose: `DeleteSynonymInput`, the input of `search.synonym.delete@1`: which set.
 * Boundary: a shape class in its own file. The path parameter is `synonymId`. It registers its schema when the module loads (STA-339 replaces
 *           the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); ADR 0492 (decision 5).
 */
import type { PublicId } from "@stackra/contracts";
import { publicId, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

const DeleteSynonymInput$ = z.object({ synonymId: publicId("syn") });

/**
 * The set to remove.
 *
 * @example
 * DeleteSynonymInput.create({ synonymId });
 */
export class DeleteSynonymInput extends Schema {
  /** The set's public id; the path parameter. */
  synonymId!: PublicId<"syn">;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[DeleteSynonymInput, DeleteSynonymInput$]]);
