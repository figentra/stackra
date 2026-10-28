/**
 * Stackra file contract:
 * Purpose: unit tests of `HasMetadata`: a new record starts with an empty bag, the model is marked, and metadata is
 *          not a system field (callers write it).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0321 (decision 4); data-layer gap mo18.
 */
import { Model, systemFieldsOf, traitsOf } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { HasMetadata } from "#core/traits/has-metadata.trait";

class Customer extends Model.with(HasMetadata) {}

describe("HasMetadata", () => {
  it("starts a record with an empty bag the caller may write", () => {
    expect(new Customer().metadata).toEqual({});
    expect(traitsOf(Customer)).toEqual([{ name: "has_metadata", options: {} }]);
    expect(systemFieldsOf(Customer)).toEqual([]);
  });
});
