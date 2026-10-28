/**
 * Stackra file contract:
 * Purpose: unit tests of `HasOwner`: a new record is unassigned, the model is marked, and the owner is not a system
 *          field (an assignment is an ordinary write).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0321 (decision 4); data-layer gap mo18.
 */
import { Model, systemFieldsOf, traitsOf } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { HasOwner } from "#node/traits/has-owner.trait";

class Ticket extends Model.with(HasOwner) {}

describe("HasOwner", () => {
  it("starts a record unassigned, with an owner the caller may set", () => {
    expect(new Ticket().ownerId).toBeNull();
    expect(traitsOf(Ticket)).toEqual([{ name: "has_owner", options: {} }]);
    expect(systemFieldsOf(Ticket)).toEqual([]);
  });
});
