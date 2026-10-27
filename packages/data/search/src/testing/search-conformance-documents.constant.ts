/**
 * Stackra file contract:
 * Purpose: `SEARCH_CONFORMANCE_DOCUMENTS`, the data every case of the `SearchDriver` conformance suite indexes.
 * Boundary: test data only, in the `./testing` entry. Text is already normalised, as `Search` hands it to a driver.
 * Runtime: isomorphic
 * Governing contract: ADR 0089 (decision 5); ADR 0221 (decision 1).
 */
import type { SearchDocument } from "#contracts/index";

/** Four products: three shirts (two white, one blue) and linen trousers. */
export const SEARCH_CONFORMANCE_DOCUMENTS: readonly SearchDocument[] = [
  {
    id: "p1",
    fields: ["white linen shirt", "summer"],
    filters: { color: ["white"], size: ["m", "l"] },
  },
  { id: "p2", fields: ["white cotton shirt", "basic"], filters: { color: ["white"], size: ["s"] } },
  { id: "p3", fields: ["blue linen shirt", "summer"], filters: { color: ["blue"], size: ["m"] } },
  { id: "p4", fields: ["linen trousers", "summer"], filters: { color: ["beige"], size: ["l"] } },
];
