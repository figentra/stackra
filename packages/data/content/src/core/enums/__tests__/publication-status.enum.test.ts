/**
 * Stackra file contract:
 * Purpose: unit tests of `PublicationStatus`: its codes are the stored contract.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0321 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { PublicationStatus } from "#core/enums/publication-status.enum";

describe("PublicationStatus", () => {
  it("names the three states", () => {
    expect([
      PublicationStatus.Draft,
      PublicationStatus.Scheduled,
      PublicationStatus.Published,
    ]).toEqual(["draft", "scheduled", "published"]);
  });
});
