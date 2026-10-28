/**
 * Stackra file contract:
 * Purpose: unit tests of `SearchModelUnknownError`: a NotFound refusal that is not retried, with its code and the
 *          model name in its details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140; ADR 0404 (decision 3).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { SearchModelUnknownError } from "#core/errors/search-model-unknown.error";

describe("SearchModelUnknownError", () => {
  it("is a NotFound refusal that is not retried, with code search_model_unknown and the model", () => {
    const refused = SearchModelUnknownError.create({ model: "Prodct" });
    expect(isRefusal(refused, SearchModelUnknownError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.NotFound);
    expect(refused.retryable).toBe(false);
    expect(refused.code).toBe("search_model_unknown");
    expect(refused.details).toEqual({ model: "Prodct" });
  });
});
