/**
 * Stackra file contract:
 * Purpose: `ListSynonymsInput`, the input of `data_maintenance.synonym.list@1`: the optional index and language to list.
 * Boundary: a shape class in its own file. Both are optional, so the list is the whole tenant's by default. It registers its schema when the module loads (STA-339 replaces
 *           the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); ADR 0492 (decision 5).
 */
import { registerSchemas, Schema } from "@stackra/validation";

import { SYNONYM_FIELDS } from "#node/constants/synonym-fields-schema.constant";

const ListSynonymsInput$ = SYNONYM_FIELDS.pick({ indexName: true, language: true }).partial();

/**
 * Which sets to list.
 *
 * @example
 * ListSynonymsInput.create({ indexName: "products" });
 */
export class ListSynonymsInput extends Schema {
  /** Only the sets of this index. */
  indexName?: string;

  /** Only the sets of this language. */
  language?: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[ListSynonymsInput, ListSynonymsInput$]]);
