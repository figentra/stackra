/**
 * Stackra file contract:
 * Purpose: `SearchSnippet`, whether search shows a snippet of a data class's fields outside the record's own team.
 * Boundary: an `Enum.of` value plus the type of the same name; one of the four effects a data class sets. The reader
 *           of the effect applies it; no product checks a class by hand.
 * Runtime: isomorphic
 * Governing contract: ADR 0341 (decisions 2 and 4).
 */
import { Enum } from "@stackra/contracts";

/** The search snippet of a class's fields. */
export const SearchSnippet = Enum.of({
  /** No snippet outside the record's own team. */
  NoSnippet: "no_snippet",
  /** Snippets as for any field. */
  Snippet: "snippet",
});

/** One of the codes above. */
export type SearchSnippet = Enum.Value<typeof SearchSnippet>;
