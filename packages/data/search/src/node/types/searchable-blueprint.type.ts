/**
 * Stackra file contract:
 * Purpose: the `Blueprint` member of `SearchableMacro`, so a migration's `t.searchable({ text, filters })` typechecks.
 * Boundary: a module augmentation only; the stand-in for the merge gen writes from each `*.macro.ts` a member hosts
 *           (`declare module "@stackra/database" { interface Blueprint { ... } }`, ADR 0159 as amended by ADR 0305).
 *           `SearchableMacro` imports this file so the augmentation travels with the macro.
 * Runtime: node
 * Governing contract: ADR 0159 as amended by ADR 0305 (macros merge into `Blueprint`); ADR 0221.
 */
import type { ColumnGroup } from "@stackra/database";

import type { SearchableColumns } from "#node/types/searchable-columns.type";

declare module "@stackra/database" {
  interface Blueprint {
    /**
     * The hybrid search columns of a `@Searchable` model: `search_vector` (or one `search_vector_<locale>` per locale),
     * `search_text` and `search_filters`, nullable, filled by @stackra/search. The GIN and trigram indexes are the
     * migration's own lines.
     */
    searchable: (columns: SearchableColumns) => ColumnGroup;
  }
}
