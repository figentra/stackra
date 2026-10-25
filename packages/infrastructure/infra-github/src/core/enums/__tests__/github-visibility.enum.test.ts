/**
 * Stackra file contract:
 * Purpose: unit tests of `GithubVisibility`: the three values GitHub's repository `visibility` field takes, in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0171 (decision 2).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { GithubVisibility } from "#core/enums/github-visibility.enum";

describe("GithubVisibility", () => {
  it("lists GitHub's visibility values", () => {
    expect(Enum.values(GithubVisibility)).toEqual(["public", "private", "internal"]);
    expect(GithubVisibility.Private).toBe("private");
  });
});
