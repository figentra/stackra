/**
 * Stackra file contract:
 * Purpose: `SearchIndexState`, where one model's index stands in one scope: valid (its documents match the facet),
 *          invalid (the `@Searchable` facet changed since the last full rebuild) or rebuilding (a reindex job runs, or
 *          stopped and resumes from its cursor).
 * Boundary: an `Enum.of` value plus the type of the same name; the `state` of each `search.indexes` row and of each
 *           `SearchIndexStatus`.
 * Runtime: isomorphic
 * Governing contract: ADR 0404 (decision 3: the reindex plan); ADR 0221 (decision 7); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** The states of an index. */
export const SearchIndexState = Enum.of({
  /** The documents match the facet the last full rebuild used. */
  Valid: "valid",
  /** The facet changed after the last full rebuild; reads still work on the old documents. */
  Invalid: "invalid",
  /** A full rebuild runs, or stopped and resumes from its cursor. */
  Rebuilding: "rebuilding",
});

/** One of the codes above. */
export type SearchIndexState = Enum.Value<typeof SearchIndexState>;
