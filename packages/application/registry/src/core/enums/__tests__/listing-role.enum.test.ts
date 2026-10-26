/**
 * Stackra file contract:
 * Purpose: unit tests of `ListingRole`: the four listing roles and their codes.
 * Boundary: test only; listings and fee schedules are test data standing in for OS admin records.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0393 (decision 1); owner M3-7.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ListingRole } from "#core/enums/listing-role.enum";

describe("ListingRole", () => {
  it("has app, connector, agency and perk", () => {
    expect(Enum.values(ListingRole)).toEqual(["app", "connector", "agency", "perk"]);
  });
});
