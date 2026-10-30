/**
 * Stackra file contract:
 * Purpose: `DeleteSynonymOutput`, the output of `search.synonym.delete@1`: the set removed.
 * Boundary: a shape class in its own file. It registers its schema when the module loads (STA-339 replaces
 *           the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); ADR 0492 (decision 5).
 */
import type { PublicId } from "@stackra/contracts";
import { publicId, registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

const DeleteSynonymOutput$ = z.object({ synonymId: publicId("syn") });

/**
 * The removed set's id.
 *
 * @example
 * return DeleteSynonymOutput.create({ synonymId: input.synonymId });
 */
export class DeleteSynonymOutput extends Schema {
  /** The removed set's public id. */
  synonymId!: PublicId<"syn">;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[DeleteSynonymOutput, DeleteSynonymOutput$]]);
