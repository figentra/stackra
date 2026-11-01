/**
 * Stackra file contract:
 * Purpose: `CreateSynonymInput`, the input of `data_maintenance.synonym.create@1`: the index, language and terms of the new set.
 * Boundary: a shape class in its own file. The rules are `SYNONYM_FIELDS`, shared with the model. It registers its schema when the module loads (STA-339 replaces
 *           the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); ADR 0492 (decision 5).
 */
import { registerSchemas, Schema } from "@stackra/validation";

import { SYNONYM_FIELDS } from "#node/constants/synonym-fields-schema.constant";

const CreateSynonymInput$ = SYNONYM_FIELDS;

/**
 * A new set.
 *
 * @example
 * CreateSynonymInput.create({ indexName: "products", language: "en", terms: ["sofa", "couch"] });
 */
export class CreateSynonymInput extends Schema {
  /** The index (the searched model's table) the set applies to. */
  indexName!: string;

  /** The language subtag the set applies to. */
  language!: string;

  /** The terms that find each other, two to sixteen. */
  terms!: string[];
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[CreateSynonymInput, CreateSynonymInput$]]);
