/**
 * Stackra file contract:
 * Purpose: `ListSynonymsOutput`, the output of `search.synonym.list@1`: the tenant's sets, oldest first.
 * Boundary: a shape class in its own file. It registers its schema when the module loads (STA-339 replaces
 *           the registration).
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 4, 13 and 26); ADR 0305 (one declaration per file); ADR 0492 (decision 5).
 */
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import { SYNONYM_VIEW_SCHEMA } from "#node/constants/synonym-view-schema.constant";
import type { SynonymView } from "#node/types/synonym-view.type";

const ListSynonymsOutput$ = z.object({ items: z.array(SYNONYM_VIEW_SCHEMA) });

/**
 * The sets.
 *
 * @example
 * return ListSynonymsOutput.create({ items: rows.map(viewOf) });
 */
export class ListSynonymsOutput extends Schema {
  /** The sets, oldest first. */
  items!: SynonymView[];
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([[ListSynonymsOutput, ListSynonymsOutput$]]);
