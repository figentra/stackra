/**
 * Stackra file contract:
 * Purpose: `UpdateSynonymOutput`, the output of `search.synonym.update@1`: the set after the change.
 * Boundary: a shape class in its own file. It registers its schema when the module loads (STA-339 replaces
 *           the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); ADR 0492 (decision 5).
 */
import type { PublicId } from "@stackra/contracts";
import { registerSchemas, Schema } from "@stackra/validation";

import { SYNONYM_VIEW_SCHEMA } from "#node/constants/synonym-view-schema.constant";

const UpdateSynonymOutput$ = SYNONYM_VIEW_SCHEMA;

/**
 * The set as stored.
 *
 * @example
 * return UpdateSynonymOutput.create({ id: row.id, indexName: row.indexName, language: row.language, terms: row.terms });
 */
export class UpdateSynonymOutput extends Schema {
  /** The set's public id. */
  id!: PublicId<"syn">;

  /** The index the set applies to. */
  indexName!: string;

  /** The language subtag the set applies to. */
  language!: string;

  /** The terms that find each other. */
  terms!: string[];
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[UpdateSynonymOutput, UpdateSynonymOutput$]]);
