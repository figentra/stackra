/**
 * Stackra file contract:
 * Purpose: `UpdateSynonymInput`, the input of `data_maintenance.synonym.update@1`: which set and its new terms.
 * Boundary: a shape class in its own file. Only the terms change; a set that moves to another index or language is a new set. The path parameter is `synonymId`. It registers its schema when the module loads (STA-339 replaces
 *           the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); ADR 0492 (decision 5).
 */
import type { PublicId } from "@stackra/contracts";
import { publicId, registerSchemas, Schema } from "@stackra/validation";

import { SYNONYM_FIELDS } from "#node/constants/synonym-fields-schema.constant";

const UpdateSynonymInput$ = SYNONYM_FIELDS.pick({ terms: true }).extend({
  synonymId: publicId("syn"),
});

/**
 * New terms for a set.
 *
 * @example
 * UpdateSynonymInput.create({ synonymId, terms: ["sofa", "couch", "settee"] });
 */
export class UpdateSynonymInput extends Schema {
  /** The set's public id; the path parameter. */
  synonymId!: PublicId<"syn">;

  /** The terms that find each other, two to sixteen; replace the old ones. */
  terms!: string[];
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[UpdateSynonymInput, UpdateSynonymInput$]]);
