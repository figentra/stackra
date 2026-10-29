/**
 * Stackra file contract:
 * Purpose: unit tests of `SavedViewGroup` and its shipped schema: a group with or without a sub-group parses, a
 *          sub-group alone or a key that is not a row path fails.
 * Boundary: test only; validates through @stackra/validation.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0359 (decision 14).
 */
import { describe, expect, it } from "@stackra/testing";
import { schemaOf, validate } from "@stackra/validation";

import { SAVED_VIEW_GROUP_SCHEMA } from "#core/constants/saved-view-group-schema.constant";
import { SavedViewGroup } from "#core/schemas/saved-view-group.schema";

describe("SavedViewGroup", () => {
  it("registers the shipped schema and parses a group and a sub-group", () => {
    expect(schemaOf(SavedViewGroup)).toBe(SAVED_VIEW_GROUP_SCHEMA);
    expect(validate(SavedViewGroup, { by: "status" }).success).toBe(true);
    // oxlint-disable-next-line unicorn/no-thenable -- reason: `then` is the saved view's sub-group key, not a promise
    expect(validate(SavedViewGroup, { by: "status", then: "channel" }).success).toBe(true);
  });

  it("refuses a sub-group alone and a bad path", () => {
    // oxlint-disable-next-line unicorn/no-thenable -- reason: `then` is the saved view's sub-group key, not a promise
    expect(validate(SavedViewGroup, { then: "channel" }).success).toBe(false);
    expect(validate(SavedViewGroup, { by: "1status" }).success).toBe(false);
  });
});
