/**
 * Stackra file contract:
 * Purpose: `CreateSynonymOutput`, the output of `data_maintenance.synonym.create@1`: the new set.
 * Boundary: a shape class in its own file. It registers its schema when the module loads (STA-339 replaces
 *           the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); ADR 0492 (decision 5).
 */
import type { PublicId } from "@stackra/contracts";
import { registerSchemas, Schema } from "@stackra/validation";

import { SYNONYM_VIEW_SCHEMA } from "#node/constants/synonym-view-schema.constant";

const CreateSynonymOutput$ = SYNONYM_VIEW_SCHEMA;

/**
 * The set as stored.
 *
 * @example
 * return CreateSynonymOutput.create({ id: row.id, indexName: row.indexName, language: row.language, terms: row.terms });
 */
export class CreateSynonymOutput extends Schema {
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
registerSchemas([[CreateSynonymOutput, CreateSynonymOutput$]]);
