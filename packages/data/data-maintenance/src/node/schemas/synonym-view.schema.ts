/**
 * Stackra file contract:
 * Purpose: `SynonymView`, what the synonym list answers for one set: its public id, index, language and terms.
 * Boundary: a shape class in its own file; never the row, so no tenant id leaves the module. It registers its schema when
 *           the module loads (STA-339 replaces the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); ADR 0492 (decision 5).
 */
import type { PublicId } from "@stackra/contracts";
import { registerSchemas, Schema } from "@stackra/validation";

import { SYNONYM_VIEW_SCHEMA } from "#node/constants/synonym-view-schema.constant";

/**
 * One synonym set as a caller sees it.
 *
 * @example
 * SynonymView.create({ id: row.id, indexName: row.indexName, language: row.language, terms: row.terms });
 */
export class SynonymView extends Schema {
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
registerSchemas([[SynonymView, SYNONYM_VIEW_SCHEMA]]);
