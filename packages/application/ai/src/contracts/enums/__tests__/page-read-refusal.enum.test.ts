/**
 * Stackra file contract:
 * Purpose: unit tests of `PageReadRefusal`: it holds exactly its snake_case codes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0231; ADR 0450 (decision 1).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { PageReadRefusal } from "#contracts/enums/page-read-refusal.enum";

describe("PageReadRefusal", () => {
  it("holds the refusal codes", () => {
    expect(Enum.values(PageReadRefusal)).toEqual([
      "egress_refused",
      "http_error",
      "not_html",
      "too_large",
      "timeout",
      "too_many_redirects",
      "unreachable",
    ]);
  });
});
